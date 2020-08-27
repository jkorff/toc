/*
 * Table of Contents jQuery Plugin - jquery.toc
 *
 * Copyright 2013-2016 Nikhil Dabas
 * Updated 2020 by J Korff
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied.  See the License for the specific language governing permissions and limitations
 * under the License.
 */

(function ($) {
    "use strict";

    // Builds a list with the table of contents in the current selector.
    // options:
    //   content:  Where to look for headings
    //   headings: String with a comma-separated list of selectors to be used as headings, ordered
    //             by their relative hierarchy level
    //   idFormat: The format of the injected IDs, default: underscores replace spaces. 
    //             Alternatives: 'kebab-case', 'camelCase'. Filters out invalid characters
    var toc = function (options) {
        return this.each(function () {
            var root = $(this),
                data = root.data(),
                thisOptions,
                stack = [root], // The upside-down stack keeps track of list elements
                listTag = this.tagName,
                currentLevel = 0,
                headingSelectors;

            // Defaults: plugin parameters override data attributes, which override our defaults
            thisOptions = $.extend(
                {
                    content: "body",
                    headings: "h1,h2,h3",
                    idFormat: ''
                },
                {
                    content: data.toc || undefined,
                    headings: data.tocHeadings || undefined,
                    idFormat: data.idFormat || undefined
                },
                options
            );
            headingSelectors = thisOptions.headings.split(",");

            // Set up some automatic IDs if we do not already have them
            $(thisOptions.content).find(thisOptions.headings).attr("id", function (index, attr) {
                // In HTML5, the id attribute must be at least one character long and can only
                // contain the characters [a-zA-Z0-9] and ISO 10646 characters U+00A0 and higher,
                // plus the hyphen (-) and the underscore (_).
                // ref: https://www.w3.org/TR/CSS2/syndata.html#characters
                //
				// We just use the HTML5 spec now because all browsers work fine with it.
                // https://mathiasbynens.be/notes/html5-id-class

                // Convert a string to camel case
                // ref: https://stackoverflow.com/a/35976812/7942404
                function toCamelCase(str){
                    return str.split(' ').map(function(word,index){
                        // If it is the first word make sure to lowercase all the chars.
                        if(index == 0){
                            return word.toLowerCase();
                        }
                        // If it is not the first word only upper case the first char and lowercase the rest.
                        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    }).join('');
                }

                var generateUniqueId = function (text) {
                    // Generate a valid ID. Spaces are replaced depending on the idFormat setting. We also check if
                    // the ID already exists in the document. If so, we append "1", "2", etc.
                    // until we find an unused ID.

                    if (text.length === 0) {
                        text = "?";
                    }

                    // Sanitise text to have only single spaces and comply with allowed characters while preserving the single spaces
                    text = text.replace(/\s+/g,' ').replace(/[^\w\-\s]/g,'');

                    var spaceReplacement,
                        baseId,
                        suffix = "",
                        count = 1;

                    // Replace spaces depending on option setting
                    switch ( thisOptions.idFormat ) {
                        case 'kebab-case':
                            spaceReplacement = '-';
                            baseId = text.replace(/\s/g, spaceReplacement).toLowerCase();
                            break;
                        case 'camelCase':
                            spaceReplacement = '';
                            baseId = toCamelCase(text);
                            break;
                        default:
                            spaceReplacement = '_';
                            baseId = text.replace(/\s/g, spaceReplacement);
                    }

                    while (document.getElementById(baseId + suffix) !== null) {
                        suffix = spaceReplacement + count++;
                    }

                    return baseId + suffix;
                };

                return attr || generateUniqueId($(this).text());
            }).each(function () {
                // What level is the current heading?
                var elem = $(this), level = $.map(headingSelectors, function (selector, index) {
                    return elem.is(selector) ? index : undefined;
                })[0];

                if (level > currentLevel) {
                    // If the heading is at a deeper level than where we are, start a new nested
                    // list, but only if we already have some list items in the parent. If we do
                    // not, that means that we're skipping levels, so we can just add new list items
                    // at the current level.
                    // In the upside-down stack, unshift = push, and stack[0] = the top.
                    var parentItem = stack[0].children("li:last")[0];
                    if (parentItem) {
                        stack.unshift($("<" + listTag + "/>").appendTo(parentItem));
                    }
                } else {
                    // Truncate the stack to the current level by chopping off the 'top' of the
                    // stack. We also need to preserve at least one element in the stack - that is
                    // the containing element.
                    stack.splice(0, Math.min(currentLevel - level, Math.max(stack.length - 1, 0)));
                }

                // Add the list item
                $("<li/>").appendTo(stack[0]).append(
                    $("<a/>").text(elem.text()).attr("href", "#" + elem.attr("id"))
                );

                currentLevel = level;
            });
        });
    }, old = $.fn.toc;

    $.fn.toc = toc;

    $.fn.toc.noConflict = function () {
        $.fn.toc = old;
        return this;
    };

    // Data API
    $(function () {
        toc.call($("[data-toc]"));
    });
}(window.jQuery));
