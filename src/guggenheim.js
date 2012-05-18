/*
 * Guggenheim.js 0.1
 * (c) 2012 Will McKenzie
 * Provided under the MIT License
 * See http://github.com/OiNutter/guggenheim.js for more details
 */

var guggenheim = function(element,opts){

	var endEventName, 
		endAnimationName,
    	vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    	document = window.document, 
    	testEl = document.createElement('div'),
    	supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    	clearProperties = {},
    	easing = {
			ease: function(pos) { return (-Math.cos(pos*Math.PI)/2) + 0.5 },
			linear: function(pos){ return pos }
		},
		animating = false,
		prefix = "",
		eventPrefix = "",
		container,
		options,
		slider,
		elements,
		filteredElements = [],
		orderedElements = [],
		supportsOpacity = typeof testEl.style.opacity == 'string', 
    	supportsFilters = typeof testEl.style.filter == 'string',
    	reOpacity = /alpha\(opacity=([^\)]+)\)/, 
    	setOpacity = function(){ }, 
    	getOpacityFromComputed = function(){ return '1' }

    function _downcase(str) { return str.toLowerCase() }
  	function _normalizeEvent(name) { return eventPrefix ? eventPrefix + name : _downcase(name) }

	function _getObjKeys(obj){
		if(typeof obj != 'object')
			return []

		var keys = [],
			prop

		for(prop in obj)
			keys.push(prop)

		return keys
	}

	function _getObjVars(obj){
		if(typeof obj != 'object')
			return []

		var vars = [],
			prop

		for(prop in obj)
			vars.push(obj[prop])

		return vars
	}

	function _mergeOptions(destination,source){
		var property,prop
		for (property in source){
			if(_getObjVars(destination[property]).length>0 && _getObjVars(source[property]).length>0){
				for(prop in source[property])
					destination[property][prop] = source[property][prop]
			} else {
				destination[property] = source[property]
			}
		}
		return destination
	}

	function _getElementDimensions(el){
		var style = (window.getComputedStyle) ? window.getComputedStyle(el,null) : el.currentStyle
		
		return {
			"height": parseFloat(style.height) + (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0),
			"width": parseFloat(style.width) + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0) + (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0),
			"margin":{
					"top": (parseFloat(style.marginTop) || 0),
					"right": (parseFloat(style.marginRight) || 0),
					"bottom": (parseFloat(style.marginBottom) || 0),
					"left": (parseFloat(style.marginLeft) || 0)
				},
			"padding":{
					"top": (parseFloat(style.paddingTop) || 0),
					"right": (parseFloat(style.paddingRight) || 0),
					"bottom": (parseFloat(style.paddingBottom) || 0),
					"left": (parseFloat(style.paddingLeft) || 0)
				}
		}
	}

	function _addEvent(el,event,callback){
		if(el.addEventListener)
			el.addEventListener(event,callback,false)
		else
			el.attachEvent(event,callback)
	}

	function _removeEvent(el,event,callback){
		if(el.removeEventListener)
			el.removeEventListener(event,callback,false)
		else
			el.detachEvent(event,callback)
	}

	if (supportsOpacity) {
    	setOpacity = function(el, value){ el.style.opacity = parseFloat(value) }
    	getOpacityFromComputed = function(computed) { return computed.opacity }
  	} else if (supportsFilters) {
    	setOpacity = function(el, value){
      		var es = el.style
      		value = parseFloat(value)
      		if (reOpacity.test(es.filter)) {
        		value = value >= 0.9999 ? '' : ('alpha(opacity=' + (value * 100) + ')')
        		es.filter = es.filter.replace(reOpacity, value)
      		} else {
        		es.filter += ' alpha(opacity=' + (value * 100) + ')'
      		}
    	}
    	getOpacityFromComputed = function(comp) {
      		var m = comp.filter.match(reOpacity)
      		return (m ? (m[1] / 100) : 1) + ''
    	}
  	}

	function _interpolate(source,target,pos){
    	return parseFloat(source+(target-source)*pos).toFixed(3)
    }

    function _s(str, p, c){ return str.substr(p,c||1); }
  	
  	function _color(source,target,pos){
	    var i = 2, j, c, tmp, v = [], r = [];
	    while(j=3,c=arguments[i-1],i--)
      	if(_s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
	        if(c.length==4) c='#'+_s(c,1)+_s(c,1)+_s(c,2)+_s(c,2)+_s(c,3)+_s(c,3);
        	while(j--) v.push(parseInt(_s(c,1+j*2,2), 16)); }
    	while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
    	return 'rgb('+r.join(',')+')';
  	}

    function _parseProps(prop){
     	var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'')
     	return isNaN(p) ? { v: q, f: _color, u: ''} : { v: p, f: _interpolate, u: q }
	}

	//animates elements
	function _animate(el,props,callback){
		var transitions = [], 
			key,
			start = (new Date).getTime(),
        	duration = options.duration*1000,
        	finish = start + duration,
        	comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
        	current = {},
        	interval,
        	target = {},
        	prop,
        	time,
        	pos,
        	curValue

        if(prefix != ""){
       		for(key in props)
     			transitions.push(key)
    
     		el.style.setProperty(prefix + 'transition-property',transitions.join(', '),'')
     		el.style.setProperty(prefix + 'transition-duration',options.duration + 's','')
     		el.style.setProperty(prefix + 'transition-timing-function',options.easing,'')
   			
   			if(options.duration>0)
   				_addEvent(el,_normalizeEvent('TransitionEnd'),callback)

     		for (key in props)
       			el.style[key] = props[key]
             
        } else {
        	
        	for (prop in props) target[prop] = _parseProps(props[prop])
        	for (prop in props) current[prop] = _parseProps(prop === 'opacity' ? getOpacityFromComputed(comp) : comp[prop])

        	interval = setInterval(function(){
        		time = (new Date).getTime()
      	    	pos = time > finish ? 1 : (time-start)/duration
	        	for(prop in target){
	        		curValue = target[prop].f(current[prop].v,target[prop].v,easing[options.easing](pos)) + target[prop].u
	        		if (prop === 'opacity') 
	        			setOpacity(el, curValue)
	        		else
	        			el.style[prop] = curValue
	        	}
       
       			if(time>finish){
        			clearInterval(interval)
      				if(callback !== undefined)
	       				callback.call()
    	    	}
        	},10);

        }
    }

    var prev = function(){
    		if(animating)
	    		return false

    		animating = true

	    	var containerDimensions = _getElementDimensions(container),
    			elDimensions = _getElementDimensions(elements[0]),
    			pages = Math.ceil(filteredElements.length/(options.rows*options.cols)),
    			sliderWidth = pages * containerDimensions.width

    		if(parseFloat(slider.style.left) != containerDimensions.padding.left)
	    		_animate(slider,{"left":(parseFloat(slider.offsetLeft) + containerDimensions.width - containerDimensions.padding.left) + 'px'},function(){animating=false})
    		else
	    		animating = false

    	},
	next = function(){
    		if(animating)
    			return false

    		animating = true

       		var containerDimensions = _getElementDimensions(container),
    			elDimensions = _getElementDimensions(elements[0]),
    			pages = Math.ceil(filteredElements.length/(options.rows*options.cols)),
    			sliderWidth = pages * containerDimensions.width
    	
    		if(parseFloat(slider.style.left) > -(sliderWidth - containerDimensions.width - containerDimensions.padding.left - containerDimensions.padding.right))
	    		_animate(slider,{"left":(parseFloat(slider.offsetLeft) - containerDimensions.width-containerDimensions.padding.left) + 'px'},function(){ animating=false})
    		else
	    		animating = false
    		
    	},

    // runs through list of results and hides any elements that aren't in the list of results
	filter = function(filterFunction){
			var row = 0,
				col = 0,
				top,
				left,
				dimensions = _getElementDimensions(elements[0]),
				containerDimensions = _getElementDimensions(container),
				page = 0,
				i,
				props = {},
				classString

			if(typeof filterFunction == 'string' || Array.isArray(filterFunction) ){
				if(typeof filterFunction == 'string')
					filterFunction = [filterFunction]
				classString = '(?=.*\\b(' + filterFunction.join(')\\b)(?=.*\\b(') + ')\\b)'
				
				filterFunction = function(el){ return (new RegExp(classString)).test(el.className)}
			}

			filteredElements = []

			_animate(slider,{"left":containerDimensions.padding.left + 'px'})

			for(i = 0; i<orderedElements.length; i++){
				if(filterFunction(orderedElements[i])){
					filteredElements.push(orderedElements[i])
					top = ((dimensions.height + dimensions.margin.bottom) * row) + dimensions.margin.top
					left = ((dimensions.width + dimensions.margin.right) * col) + (containerDimensions.width*page) + dimensions.margin.left
				
					props = {
						"top":top + "px",
						"left": left + "px",
						"opacity":"1"
					}

					col++

					if(col==options.cols){
						col = 0 
						row++
						if(row==options.rows){
							row = 0
							page++
						}
					}

				} else {
					props = {
						"opacity":"0"
					}
				}

				_animate(orderedElements[i],props)

			}

			return filteredElements

		},

	// reorders elements according to new order
	order = function(orderedResults){

			var row = 0,
				col = 0,
				top,
				left,
				dimensions = _getElementDimensions(elements[0]),
				containerDimensions = _getElementDimensions(container),
				page = 0,
				i,
				props = {},
				el

			orderedElements = []

			for(i = 0; i<orderedResults.length; i++){
				el = (typeof orderedResults[i] == 'string') ? container.querySelector(orderedResults[i]) : orderedResults[i]
				orderedElements.push(el)
				if(filteredElements.indexOf(el) != -1){
					top = ((dimensions.height + dimensions.margin.bottom) * row) + dimensions.margin.top
					left = ((dimensions.width + dimensions.margin.right) * col) + ((containerDimensions.width)*page) + dimensions.margin.left
				
					props = {
						"top":top + "px",
						"left": left + "px",
						"opacity":"1"
					}

					_animate(el,props)

					col++

					if(col==options.cols){
						col = 0 
						row++
						if(row==options.rows){
							row = 0
							page++
						}
					}
				}

			}

			return orderedElements

		},

	reset = function(){
			var initialOrder = [],
				i
			filteredElements = orderedElements = []

			for(i = 0;i<elements.length;i++){
				filteredElements.push(elements[i])
				initialOrder.push(elements[i])
			}

			orderedElements = filteredElements

			order(initialOrder)
		}

	
	function setUpElements(){
		var i,
			width = 0,
			height = 0,
			containerDimensions = _getElementDimensions(container)
		
		for(i=0;i<elements.length;i++){
			dimensions = _getElementDimensions(elements[i])
			if(dimensions.width > width) width = dimensions.width - dimensions.padding.left - dimensions.padding.right
			if(dimensions.height > height) height = dimensions.height - dimensions.padding.top - dimensions.padding.bottom
		}

		if (width>containerDimensions.width/options.cols) width = Math.floor(containerDimensions.width/options.cols)
		if (height>containerDimensions.height/options.rows) height = Math.floor(containerDimensions.height/options.rows)

		for(i=0;i<elements.length;i++){
			elements[i].style.position = 'absolute'
			elements[i].style.width = width + 'px'
			elements[i].style.height = height + 'px'
			elements[i].style.left = 0 + 'px'
			elements[i].style.top = 0 + 'px'
			if(supportsOpacity)
				elements[i].style.opacity = 1
			else
				elements[i].style.filter = 'alpha(opacity=100)'

		}
	}
	
	
	if(typeof element == 'string' && document.querySelector(element)==null)
		throw 'Element ' + element + " does not exist!"

	container = (typeof element == 'string') ? document.querySelector(element): element
	
	options = _mergeOptions({
		'selector':'div.guggenheim-item',
		'rows':'auto',
		'cols':'auto',
		'duration':0.5,
		'easing':'ease',
		'slider':'div.guggenheim-slider',
		'width':null,
		'height':null,
	},opts)

	//set up container
	container.style.overflow = 'hidden'
	if(container.style.position == '') 
		container.style.position = 'relative'

	if(options.width != null)
		container.style.width = options.width + 'px'

	if(options.height != null)
		container.style.height = options.height + 'px'

	//set up elements
	elements = container.querySelectorAll(options.selector)

	if(!elements.length)
		throw 'Gallery is empty'

	setUpElements()

	var containerDimensions = _getElementDimensions(container), 
		dimensions, 
		width, 
		height,
		i,
		slider,
		_scope,
		values = _getObjVars(vendors),
  		keys = _getObjKeys(vendors)

  	//calc rows and columns
	if(options.cols == 'auto'){
		dimensions = _getElementDimensions(elements[0])
		width = dimensions.width + dimensions.margin.left + dimensions.margin.right
		options.cols = Math.floor(containerDimensions.width/width)
	}

	if(options.rows == 'auto'){
		dimensions = _getElementDimensions(elements[0])
		height = dimensions.height + dimensions.margin.top + dimensions.margin.bottom
		options.rows = Math.floor(containerDimensions.height/height)
	}

	//set up slider
	slider = container.querySelector(options.slider)
	slider.style.left = containerDimensions.padding.left + "px"
	slider.style.position = 'relative'
	  		
	;(function(){
		for(var i=0;i<keys.length;i++){
 			if (testEl.style[keys[i] + 'TransitionProperty'] !== undefined) {
				prefix = '-' + _downcase(keys[i]) + '-'
   				eventPrefix = values[i]
   				return false
  			}
		}
	})()

	clearProperties[prefix + 'transition-property'] =
	clearProperties[prefix + 'transition-duration'] =
	clearProperties[prefix + 'transition-timing-function'] =
	clearProperties[prefix + 'animation-name'] =
	clearProperties[prefix + 'animation-duration'] = ''

  	reset()

		return {
			"reset":reset,
			"order":order,
			"filter":filter,
			"prev":prev,
			"next":next
		}

}

if(!Array.isArray) {  
  Array.isArray = function (arg) {  
    return Object.prototype.toString.call(arg) == '[object Array]';  
  };  
}

if (!Array.prototype.indexOf) {  
    Array.prototype.indexOf = function (el /*, from */ ) {  
		"use strict";  
        if (this == null)
            throw new TypeError();  

        var t = Object(this),
            len = t.length >>> 0,
            n,
            k;

        if (len === 0)
            return -1;  
           
        n = 0;  
        if (arguments.length > 0) {  
            n = Number(arguments[1]);  
            if (n != n) // shortcut for verifying if it's NaN  
                n = 0;  
            else if (n != 0 && n != Infinity && n != -Infinity)
                n = (n > 0 || -1) * Math.floor(Math.abs(n));  
        }  

        if (n >= len)
            return -1;  
           
        k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);  
        for (; k < len; k++) {  
            if (k in t && t[k] === el)
                return k;  
        }
        return -1;  
    }  
} 