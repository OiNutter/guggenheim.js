;(function(global){

	var _scope = this,
		endEventName, 
		endAnimationName,
    	vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    	document = window.document, 
    	testEl = document.createElement('div'),
    	supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    	clearProperties = {}
    	easing = {
			ease: function(pos) { return (-Math.cos(pos*Math.PI)/2) + 0.5 },
			linear: function(pos){ return pos }
		}

	_scope.prefix = ""

    function _downcase(str) { return str.toLowerCase() }
  	function _normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  	

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
			if(_getObjVars(destination[property]).length>0 && _scope._getObjVars(source[property]).length>0){
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

	function _interpolate(source,target,pos){
    	return (source+(target-source)*pos).toFixed(3)
    }

    function _parseProps(prop){
     	var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'')
     	return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: _interpolate, u: q }
   }

	//animates elements
	function _animate(el,props,callback){
		var transitions = [], 
			key,
			start = (new Date).getTime(),
        	duration = _scope.options.duration*1000,
        	finish = start + duration,
        	comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
        	current = {},
        	interval,
        	target = {},
        	prop,
        	time = (new Date).getTime(),
        	pos

        if(_scope.prefix != ""){
       		for(key in props)
     			transitions.push(key)
    
     		el.style.setProperty(_scope.prefix + 'transition-property',transitions.join(', '),'')
     		el.style.setProperty(_scope.prefix + 'transition-duration',_scope.options.duration + 's','')
     		el.style.setProperty(_scope.prefix + 'transition-timing-function',_scope.options.easing,'');
   
     		for (key in props)
       			el.style[key] = props[key]
             
        } else {
        	
        	for (prop in props) target[prop] = _parseProps(props[prop])
        	for (prop in props) current[prop] = _parseProps(comp[prop])
        	interval = setInterval(function(){
      	    	pos = time > finish ? 1 : (time-start)/duration
	        	for(prop in target)
        			el.style[prop] = target[prop].f(current[prop].v,target[prop].v,easing[_scope.options.easing](pos)) + target[prop].u
       
       			if(time>finish){
        			clearInterval(interval)
      				if(callback !== undefined)
	       				callback.call()
    	    	}
        	},10);
        }
    }

    _scope.prev = function(){
    	var slider = _scope.container.querySelector(_scope.options.slider),
    		containerDimensions = _getElementDimensions(_scope.container)

    	if(parseFloat(slider.offsetLeft) != 0)
    		slider.style.left = (parseFloat(slider.style.left) + containerDimensions.width) + 'px'

    }

    _scope.next = function(){
       	var slider = _scope.container.querySelector(_scope.options.slider),
    		containerDimensions = _getElementDimensions(_scope.container),
    		elDimensions = _getElementDimensions(_scope.elements[0]),
    		pages = Math.ceil(_scope.filteredElements.length/(_scope.options.rows*_scope.options.cols))
    		sliderWidth = pages * containerDimensions.width

    	if(parseFloat(slider.offsetLeft) > -(sliderWidth - containerDimensions.width))
    		_animate(slider,{"left":(parseFloat(slider.offsetLeft) - containerDimensions.width) + 'px'})
    	}
    	
    }

	// runs through list of results and hides any elements that aren't in the list of results
	_scope.filter = function(filterFunction){
		var row = 0,
			col = 0,
			top,
			left,
			dimensions = _getElementDimensions(_scope.elements[0]),
			containerDimensions = _getElementDimensions(_scope.container),
			page = 0,
			i,
			props = {}

		_scope.filteredElements = []

		for(i = 0; i<_scope.orderedElements.length; i++){
			if(filterFunction(_scope.orderedElements[i])){
				_scope.filteredElements.push(_scope.orderedElements[i])
				top = ((dimensions.height + dimensions.margin.bottom) * row) + dimensions.margin.top
				left = ((dimensions.width + dimensions.margin.right) * col) + (containerDimensions.width*page) + dimensions.margin.left
			
				props = {
					"top":top + "px",
					"left": left + "px",
					"opacity":1
				}

				col++

				if(col==_scope.options.cols){
					col = 0 
					row++
					if(row==_scope.options.rows){
						row = 0
						page++
					}
				}

			} else {
				props = {"opacity":0}
			}

			_animate(_scope.orderedElements[i],props)

		}

	}

	// reorders elements according to new order
	_scope.order = function(orderedResults){

		var row = 0,
			col = 0,
			top,
			left,
			dimensions = _getElementDimensions(_scope.elements[0]),
			containerDimensions = _getElementDimensions(_scope.container),
			page = 0,
			i,
			props = {},
			el

		_scope.orderedElements = []

		for(i = 0; i<orderedResults.length; i++){
			el = _scope.container.querySelector(orderedResults[i])
			_scope.orderedElements.push(el)
			if(_scope.filteredElements.indexOf(el) != -1){
				top = ((dimensions.height + dimensions.margin.bottom) * row) + dimensions.margin.top
				left = ((dimensions.width + dimensions.margin.right) * col) + (containerDimensions.width*page) + dimensions.margin.left
			
				props = {
					"top":top + "px",
					"left": left + "px",
					"opacity":1
				}

				_animate(el,props)

				col++

				if(col==_scope.options.cols){
					col = 0 
					row++
					if(row==_scope.options.rows){
						row = 0
						page++
					}
				}
			}

		}

	}

	_scope.reset = function(){
		var initialOrder = []

		_scope.filteredElements = _scope.orderedElements = []

		for(i = 0;i<_scope.elements.length;i++){
			_scope.filteredElements.push(_scope.elements[i])
			initialOrder.push('#' + _scope.elements[i].id)
		}

		_scope.orderedElements = _scope.filteredElements

		order(initialOrder)
	}

	function initialize(element,options){
		if(typeof element == 'string' && document.querySelector(element)==null)
			throw new Exception('Element ' + element + " does not exist!");

		_scope.container = (typeof element == 'string') ? document.querySelector(element): element
		_scope.options = _mergeOptions({
			'selector':'div.artois-item',
			'rows':'auto',
			'cols':'auto',
			'duration':0.5,
			'easing':'ease',
			'slider':'div.artois-slider'
			},options)

		_scope.elements = _scope.container.querySelectorAll(_scope.options.selector)
		
		var containerDimensions = _getElementDimensions(_scope.container), 
			elDimensions, 
			width, 
			height,
			i,
			slider

		if(_scope.options.cols == 'auto'){
			dimensions = _getElementDimensions(_scope.elements[0])
			width = dimensions.width + dimensions.margin.left + dimensions.margin.right
			_scope.options.cols = Math.floor(containerDimensions.width/width)
		}

		if(_scope.options.rows == 'auto'){
			dimensions = _getElementDimensions(_scope.elements[0])
			height = dimensions.height + dimensions.margin.top + dimensions.margin.bottom
			_scope.options.rows = Math.floor(containerDimensions.height/height)
		}

		//set up slider
		slider = _scope.container.querySelector(_scope.options.slider)
		slider.style.left = 0 + "px"

		_scope.reset()

		return _scope
	}

	(function(){
		var values = _getObjVars(vendors),
  			keys = _getObjKeys(vendors),
  			i
  		for(i=0;i<keys.length;i++){
  			if (testEl.style[keys[i] + 'TransitionProperty'] !== undefined) {
      			_scope.prefix = '-' + _downcase(keys[i]) + '-'
      			_scope.eventPrefix = values[i]
      			return false
    		}
  		}
  	})()

  	clearProperties[prefix + 'transition-property'] =
  	clearProperties[prefix + 'transition-duration'] =
  	clearProperties[prefix + 'transition-timing-function'] =
  	clearProperties[prefix + 'animation-name'] =
  	clearProperties[prefix + 'animation-duration'] = ''

	global.artois = initialize

})(this);