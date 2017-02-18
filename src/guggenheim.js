/*
 * Guggenheim.js 0.3
 * (c) 2012 Will McKenzie
 * Provided under the MIT License
 * See http://github.com/OiNutter/guggenheim.js for more details
 */

;(function(){

	var guggenheim = function(element,opts){

		var vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
			document = window.document,
			testEl = document.createElement('div'),
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
			getOpacityFromComputed = function(){ return '1' },
			handlers = {},
			zid=1,
			curFilter = function(){return true},
			paginationCallback = function(){ animating = false },

			//setup properties
			containerDimensions,
			elDimensions,
			width,
			height,
			slider,
			values,
			keys,

			// public methods
			prev = function(){
					if(animating)
						return false

					animating = true

					var numPerPage = options.cols * options.rows,
						thisPage = currentPage(),
						newEls = filteredElements.slice((thisPage-2)*numPerPage,((thisPage-2)*numPerPage) + numPerPage)

					if(newEls.length)
						_animate(slider,{"left":(parseFloat(slider.offsetLeft) + containerDimensions.width - containerDimensions.padding.left) + 'px'},paginationCallback)
					else
						animating = false

					return newEls

				},
			next = function(){
					if(animating)
						return false

					animating = true

					var	numPerPage = options.cols * options.rows,
						thisPage = currentPage(),
						newEls = filteredElements.slice(thisPage*numPerPage,(thisPage*numPerPage) + numPerPage)

					if(newEls.length)
						_animate(slider,{"left":(parseFloat(slider.offsetLeft) - containerDimensions.width-containerDimensions.padding.left) + 'px'},paginationCallback)
					else
						animating = false

					return newEls

				},

			jumpTo = function(page,animate){

					if(animating)
						return false

					if(animate==null)
						animate=true

					animating = true

					var pages = numPages(),
						thisPage = currentPage(),
						offset = -((page-1) * (containerDimensions.width-containerDimensions.padding.left)) + 'px',
						numPerPage = options.cols * options.rows,
						newEls = filteredElements.slice((page-1)*numPerPage,((page-1)*numPerPage) + numPerPage)

					if(thisPage != page && page <= pages && page > 0){
						if(animate)
							_animate(slider,{"left":offset},paginationCallback)
						else
							slider.style.left = offset
							animating=false
					} else {
						animating = false
					}

					return newEls
			},

			currentPage = function(){
				var page = Math.ceil(-parseFloat(slider.style.left)/containerDimensions.width) + 1

				return typeof page == "number" ? page : 1
			},

			numPages = function(){
				return Math.ceil(filteredElements.length/(options.rows*options.cols))
			},

			isVisible = function(el){
				var index = filteredElements.indexOf(el),
					numPerPage = options.rows * options.cols,
					start = (currentPage()-1) * numPerPage,
					end = (start+numPerPage<=filteredElements.length) ? start+numPerPage : filteredElements.length

				return index != -1 && index >= start && index < end
			},

			// runs through list of results and hides any elements that aren't in the list of results
			filter = function(filterFunction,animate){

					if(!elements.length)
						return false

					if(animate==null)
						animate=true

					var row = 0,
						col = 0,
						page = 0,
						i,
						props,
						el

					filterFunction = sanitiseFilterFunction(filterFunction)

					curFilter = filterFunction

					filteredElements = []

					_animate(slider,{"left":containerDimensions.padding.left + 'px'})

					for(i = 0; i<orderedElements.length; i++){
						el = orderedElements[i]
						if(filterFunction(el)){
							filteredElements.push(el)
							props = getNewProperties(row,col,page)

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

						updateElement(el,props,animate)

					}

					return filteredElements

				},

			// reorders elements according to new order
			order = function(orderedResults,animate){

					if(!elements.length)
						return false

					if(animate==null)
						animate=true

					var row = 0,
						col = 0,
						page = 0,
						props,
						i,
						el,
						newFiltered = []

					orderedElements = []

					for(i = 0; i<orderedResults.length; i++){
						el = (typeof orderedResults[i] == 'string') ? container.querySelector(orderedResults[i]) : orderedResults[i]
						orderedElements.push(el)
						if(filteredElements.indexOf(el) != -1){
							newFiltered.push(el)
							props = getNewProperties(row,col,page)

							updateElement(el,props,animate)

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

					//set filtered elements to new order
					filteredElements = newFiltered

					return orderedElements

				},

			reset = function(animate){
					var i

					filteredElements = orderedElements = []

					for(i = 0;i<elements.length;i++)
						filteredElements.push(elements[i])

					orderedElements = filteredElements

					order(orderedElements,animate)
				},

	  reload = function(animate){

		  elements = container.querySelectorAll(options.selector)
		  setUpElements()
		  reset(animate)

	  },

			add = function(el,position){
					var matchesFilter = curFilter(el)

					//set up styles
					el.style.position = "absolute"
					el.style.width = (elDimensions.width - elDimensions.padding.left - elDimensions.padding.right) + "px"
					el.style.height = (elDimensions.height - elDimensions.padding.top - elDimensions.padding.bottom) + "px"
					el.style.top = -(el.style.height+50)+"px"
					el.style.left = (containerDimensions.width+50)+"px"
					if(supportsOpacity)
						el.style.opacity = matchesFilter ? 1 : 0
					else
						el.style.filter = 'alpha(opacity=' + (matchesFilter ? 100 : 0) + ')'

					slider.appendChild(el)

					if(matchesFilter)
						filteredElements.splice(position-1,0,el)

					orderedElements.splice(position-1,0,el)
					elements = container.querySelectorAll(options.selector)

					order(orderedElements)

					return filteredElements
				},

			remove = function(el){
					var filteredIndex = filteredElements.indexOf(el),
						jumpBack = filteredIndex == filteredElements.length-1 && filteredElements.length%(options.rows*options.cols) == 1

					orderedElements.splice(orderedElements.indexOf(el),1)
					filteredElements.splice(filteredIndex,1)
					slider.removeChild(el)
					elements = container.querySelectorAll(options.selector)

					if(filteredElements.length)
						order(orderedElements)

					if(jumpBack)
						jumpTo(currentPage()-1)

					return filteredElements
				},

			getVisible = function(){
					var numPerPage = options.rows * options.cols
					return filteredElements.slice((currentPage()-1)*numPerPage,numPerPage)
				},

			getCurrent = function(){
				return filteredElements
			}

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

		function _zid(el) {
			return el._zid || (el._zid = zid++)
		}

		function _addEvent(el,event,callback){

			var id = _zid(el)

			if(!handlers[id])
				handlers[id] = {}

			if(!handlers[id][event])
				handlers[id][event] = []

			handlers[id][event].push(callback)

			if(el.addEventListener)
				el.addEventListener(event,callback,false)
			else
				el.attachEvent(event,callback)
		}

		function _detachEvent(el,event,callback){
			if(el.removeEventListener)
				el.removeEventListener(event,callback,false)
			else
				el.detachEvent(event,callback)
		}

		function _removeEvent(el,event,callback){
			var id = _zid(el),
				i
			if(handlers[id] && handlers[id][event]){
				for(i=0;i<handlers[id][event].length;i++){
					if(!callback || callback==handlers[id][event][i]){
						handlers[id][event].splice(i,1)
						_detachEvent(el,event,handlers[id][event][i])
					}
				}
			}
		}

		function sanitiseFilterFunction(filterFunction){
			var classString

			if(typeof filterFunction == 'string' || Array.isArray(filterFunction) ){
				if(typeof filterFunction == 'string')
					filterFunction = [filterFunction]
				classString = '(?=.*\\b(' + filterFunction.join(')\\b)(?=.*\\b(') + ')\\b)'

				filterFunction = function(el){ return (new RegExp(classString)).test(el.className)}
			}
			return filterFunction
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

		function _s(str, p, c){
			return str.substr(p,c||1)
		}

		function _color(source,target,pos){
			var i = 2,
				j,
				c,
				tmp,
				v = [],
				r = []

			while(j=3,c=arguments[i-1],i--){
				if(_s(c,0)=='r'){
					c = c.match(/\d+/g)
					while(j--)
						v.push(~~c[j])
				} else {
					if(c.length==4)
						c='#'+_s(c,1)+_s(c,1)+_s(c,2)+_s(c,2)+_s(c,3)+_s(c,3)

					while(j--)
						v.push(parseInt(_s(c,1+j*2,2), 16))
				}
			}

			while(j--){
				tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos)
				r.push(tmp<0?0:tmp>255?255:tmp)
			}

			return 'rgb('+r.join(',')+')'
		}

		function _parseProps(prop){
			var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'')
			return isNaN(p) ? { v: q, f: _color, u: ''} : { v: p, f: _interpolate, u: q }
		}

		function _animateCSS(el,props,callback){

			var transitions = [],
				key

			for(key in props)
				transitions.push(key)

			el.style.setProperty(prefix + 'transition-property',transitions.join(', '),'')
			el.style.setProperty(prefix + 'transition-duration',options.duration + 's','')
			el.style.setProperty(prefix + 'transition-timing-function',options.easing,'')

			_removeEvent(el,_normalizeEvent('TransitionEnd'))

			if(options.duration>0)
				_addEvent(el,_normalizeEvent('TransitionEnd'),callback)

			for (key in props)
				el.style[key] = props[key]

		}

		function _animateJS(el,props,callback){

			var	start = (new Date).getTime(),
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

			for(prop in props)
				target[prop] = _parseProps(props[prop])

			for(prop in props)
				current[prop] = _parseProps(prop === 'opacity' ? getOpacityFromComputed(comp) : comp[prop])

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
			},10)

		}

		//animates elements
		function _animate(el,props,callback){

			if(prefix != "")
				_animateCSS(el,props,callback)
			else
				_animateJS(el,props,callback)
		}

		function getNewProperties(row,col,page){

			var top = ((elDimensions.height + elDimensions.margin.top + elDimensions.margin.bottom) * row),
				left = ((elDimensions.width + elDimensions.margin.right + elDimensions.margin.left) * col) + ((containerDimensions.width)*page),
				props = {
					"top":top + "px",
					"left": left + "px",
					"opacity":"1"
				}

			return props

		}

		function updateElement(el, props, animate){

			if(animate){
				_animate(el,props)
			} else {
				el.style.top = props.top || el.style.top
				el.style.left = props.left || el.style.top

				if(supportsOpacity)
					el.style.opacity = props.opacity
				else
					el.style.filter = 'alpha(opacity=' + (parseInt(props.opacity)*10) + ')'
			}

		}

		function setInitialElementStyle(el,width,height){

			el.style.position = 'absolute'
			el.style.width = width + 'px'
			el.style.height = height + 'px'
			el.style.left = 0 + 'px'
			el.style.top = 0 + 'px'
			if(supportsOpacity)
				el.style.opacity = 1
			else
				el.style.filter = 'alpha(opacity=100)'

		}

		function parseDimensions(measurements,dimensions){

			var width = 0,
				height = 0,
				extraWidth = measurements.extraWidth || 0,
				extraHeight = measurements.extraHeight || 0,
				thisExtraWidth = dimensions.padding.left + dimensions.padding.right,
				thisExtraHeight = dimensions.padding.top + dimensions.padding.bottom,
				horizontalMargin = measurements.horizontalMargin || 0,
				verticalMargin = measurements.verticalMargin || 0,
				thisHorizontalMargin = dimensions.margin.left + dimensions.margin.right,
				thisVerticalMargin = dimensions.margin.top + dimensions.margin.bottom

				if(thisExtraWidth>extraWidth)
					extraWidth = thisExtraWidth

				if(thisExtraHeight>extraHeight)
					extraHeight = thisExtraHeight

				if(thisHorizontalMargin>horizontalMargin)
					horizontalMargin = thisHorizontalMargin

				if(thisVerticalMargin>verticalMargin)
					verticalMargin = thisVerticalMargin

				if(dimensions.width>width)
					width = dimensions.width - extraWidth

				if(dimensions.height>height)
					height = dimensions.height - extraHeight

				return {
					width: width,
					height: height,
					extraWidth: extraWidth,
					extraHeight: extraHeight,
					horizontalMargin: horizontalMargin,
					verticalMargin: verticalMargin
				}

		}

		function setUpElements(){
			var i,
				measurements = {}

			for(i=0;i<elements.length;i++)
				measurements = parseDimensions(measurements,_getElementDimensions(elements[i]))

			if (options.cols != "auto" && (measurements.width+measurements.horizontalMargin)>containerDimensions.width/options.cols)
				measurements.width = Math.floor(containerDimensions.width/options.cols) - measurements.extraWidth - measurements.horizontalMargin

			if (options.rows != "auto" && (measurements.height+measurements.verticalMargin)>containerDimensions.height/options.rows)
				measurements.height = Math.floor(containerDimensions.height/options.rows) - measurements.extraHeight - measurements.verticalMargin

			for(i=0;i<elements.length;i++)
				setInitialElementStyle(elements[i],measurements.width,measurements.height)

			elDimensions = _getElementDimensions(elements[0])

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
			'height':null
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

		containerDimensions = _getElementDimensions(container)
		elDimensions = _getElementDimensions(elements[0])
		values = _getObjVars(vendors)
		keys = _getObjKeys(vendors)

		//calc rows and columns
		if(options.cols == 'auto'){
			width = elDimensions.width + elDimensions.margin.left + elDimensions.margin.right
			options.cols = Math.floor(containerDimensions.width/width)
		}

		if(options.rows == 'auto'){
			height = elDimensions.height + elDimensions.margin.top + elDimensions.margin.bottom
			options.rows = Math.floor(containerDimensions.height/height)
		}

		setUpElements()

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

		reset(false)

		return {
			"reset":reset,
			"reload":reload,
			"order":order,
			"filter":filter,
			"prev":prev,
			"next":next,
			"jumpTo":jumpTo,
			"currentPage":currentPage,
			"numPages":numPages,
			"remove":remove,
			"add":add,
			"isVisible":isVisible,
			"getVisible":getVisible,
			"getCurrent":getCurrent
		}

	}

	if(!Array.isArray){
		Array.isArray = function(arg){
			return Object.prototype.toString.call(arg) == '[object Array]'
		}
	}

	if(!Array.prototype.indexOf){
		Array.prototype.indexOf = function(el /*, from */ ){
			"use strict";
			if (this == null)
				throw new TypeError()

			var t = Object(this),
				len = t.length >>> 0,
				n,
				k

			if (len === 0)
				return -1

			n = 0
			if(arguments.length > 0){
				n = Number(arguments[1])
				if(n != n) // shortcut for verifying if it's NaN
					n = 0
				else if(n != 0 && n != Infinity && n != -Infinity)
					n = (n > 0 || -1) * Math.floor(Math.abs(n))
			}

			if(n >= len)
				return -1

			k = n >= 0 ? n : Math.max(len - Math.abs(n), 0)
			for(; k < len; k++){
				if (k in t && t[k] === el)
					return k
			}
			return -1
		}
	}

	window.guggenheim = guggenheim
})()
