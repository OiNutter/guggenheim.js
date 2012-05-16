Guggenheim.js
=============

Guggenheim.js is a framework agnostic plugin for creating sexy interactive galleries. It uses CSS3 animation (with a fallback to Javascript) to create animated filtering, reordering and pagination of your gallery.


Usage
-----

Include the guggenheim.js file in your page

```html
<script type="text/javascript" src="/path/to/guggenheim.js"></script>
```

Set up your gallery like this (I know the class on each element is a bit ugly, but it keeps you safe if you have any sub divs. If you know that isn't the case feel free to omit it and change the selector option when initialising)

```html
<div id="guggenheim-container">
	<div class="guggenheim-slider">
		<div class='guggenheim-item'>1</div>
		<div class='guggenheim-item'>2</div>
		<div class='guggenheim-item'>3</div>
		<div class='guggenheim-item'>4</div>
		<div class='guggenheim-item'>5</div>
		<div class='guggenheim-item'>6</div>
		<div class='guggenheim-item'>7</div>
		<div class='guggenheim-item'>8</div>
		<div class='guggenheim-item'>9</div>
		<div class='guggenheim-item'>10</div>
		<div class='guggenheim-item'>11</div>
		<div class='guggenheim-item'>12</div>
		<div class='guggenheim-item'>13</div>
		<div class='guggenheim-item'>14</div>
		<div class='guggenheim-item'>15</div>
		<div class='guggenheim-item'>16</div>
		<div class='guggenheim-item'>17</div>
	</div>
</div>
```

Now initialise your gallery

```Javascript
var gallery = guggenheim(element[,options]);
```

Where element is either the css selector of the container, or the actual DOM element itself. Options is an optional argument that will specify customisation variables. The full range of options is detailed below.

* selector - `div.guggenheim-item` - The CSS selector for the gallery items.
* rows - `auto` - How many rows the gallery should have, if `auto` it will calculate how many will fit into the container (container must have fixed height).
* cols - `auto` - How many columns the gallery should have, if `auto` it will calculate how many will fit into the container (container must have fixed width).
* duration - `0.5` - How long each animation should last.
* easing - `ease` - Exasing type for animations, currently supports `ease` and `linear`.
* slider - `div.guggenheim-slider` - CSS selector for the internal wrapper element used for the gallery pagination.
* width - `null` - Integer width for the container in pixels. If null will expect there to be a width set in the css.
* height - `null` - Integer height for the container in pixels. If null will expect there to be a height set in the css.

Once you have your gallery initialised you can manipulate it by calling one of the methods detailed below on it.

Methods
-------

### Filter ###

``` Javascript
gallery.filter(class|classes|filterFunction);
```

The `filter` function will filter the items in your gallery based on one of the 3 possible argument types.

* class - If you pass a string through, guggenheim will search for elements that have a class with the same name. You can pass a list of optional classes by seperating them with the `|` character e.g. `'red|blue'`.
* classes - You can also pass an array of class strings through, using the format specified by the class option. Guggenheim will filter to elements that match all supplied class strings.
* filterFunction - Alternatively you can just pass your own function to run on each element.


### Order ###

``` Javascript
gallery.order(newOrder);
```

The `order` function will reorder the elements according to the order passed through to it. `newOrder` should be an array of css selectors that will uniquely identify each element, such as ids.


### Reset ###

``` Javascript
gallery.reset();
```

The `reset` function resets the gallery to it's initial, unfiltered, unordered state.

### Next and Prev ###

``` Javascript
gallery.next();
gallery.prev();
```

The `next` and `prev` buttons are used for paginating through the gallery.


CSS
---

The minimum CSS required for this to work is to specify a width and height for the gallery container. You can either set these in CSS or pass them as options to Guggenheim. Guggenheim will add the rest of the required styles.


Examples
--------

Check out the [demo page](http://oinutter.github.com/guggenheim.js)


Building
--------

[![Build Status](https://secure.travis-ci.org/OiNutter/guggenheim.js.png)](http://travis-ci.org/OiNutter/guggenheim.js)

To build guggenheim you will need to install Jake and uglify-js.

``` bash
npm install -g jake
npm instal uglify-js
```

Then just run

``` bash
jake guggenheim:build
```

This will minify the file and place it in the dist folder.

Contributing
------------

Please feel free to fork, fiddle, play with this as much as you like. If you add something useful or fix something broken and think it should be in the main repository then please by all means send me a Pull Request and I'll take a look. If possible please add tests.

TODO
----

* Add more tests

License
-------

Copyright (c) 2012 Will McKenzie
http://oinutter.co.uk

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



[![Endorse Me](http://api.coderwall.com/OiNutter/endorsecount.png)](http://coderwall.com/OiNutter)