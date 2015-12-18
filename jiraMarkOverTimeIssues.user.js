// ==UserScript==
// @name                Jira Mark Over time issues
// @namespace	        jira
// @description	        Adds a red background color to the issues that are at risk of going over the estimated time
// @require             http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @require             https://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.js
// @include		        http://jira.*
// @include		        https://jira.*
// @grant               none
// @version             0.1.0
// ==/UserScript==

// Required in order to not throw an error in Firefox
this.jQuery = jQuery.noConflict(true);

(function ($) {
    // Constants
    var COLOR_50_PERCENT_SPENT = '#FFF189',
        COLOR_75_PERCENT_SPENT = '#FFBD67',
        COLOR_100_PERCENT_SPENT = '#FF6464',
        COOKIE_NAME = 'storyPointInHours';

    // Global privates
    var _STORY_POINT_IN_HOURS = $.cookie(COOKIE_NAME) || 8;

    // Init script
    $(document).ready(function ($) {
        var tryCount = 0,
            maxTries = 10;

        // We need to wait for all the issues to load into the DOM. I think they're loaded with AJAX or something...
        setTimeout(function pollForIssuesLoaded() {
            var $issues = $('.js-issue');

            if ($issues.length > 0) {
                init($issues);
            }
            else if(tryCount < maxTries) {
                console.log('MARK ISSUES PLUGIN: Waiting for the board to be fully loaded into the DOM...');
                tryCount++;
                pollForIssuesLoaded();
            }
        }, 100);
    });

    function init($issues) {
        addToggleButton();
        //addStoryPointHourField();
        markOverTimeIssues($issues);
    }

    function markOverTimeIssues($issues) {
        var $metadata,
            $estimate,
            estimatedTime,
            $storyPointBadge,
            storyPointsInMinutes,
            $timeSpent,
            timeSpent,
            fiftyPercentLimit,
            seventyFivePercentLimit,
            overTimeLimit;

        if(!$issues.length) {
            return $issues;
        }

        // Go through all the issues on the board
        $issues.each(function () {
            $metadata = $(this).find('.ghx-extra-field-content');

            // Some projects don't use estimates in hours, in those cases we'll assume that $timeSpent is the only child
            if($metadata.length > 1) {
                $estimate = $($metadata[0]);
                $timeSpent = $($metadata[1]);

                estimatedTime = getAsMinutesFromTimeString($estimate.text());
            }
            else {
                $timeSpent = $($metadata[0]);
            }

            timeSpent = getAsMinutesFromTimeString($timeSpent.text());

            //$storyPointBadge = $(this).find('.aui-badge');
            //storyPointsInMinutes = parseFloat($storyPointBadge.text()) * _STORY_POINT_IN_HOURS * 60 || 0; // Convert Story Points to minutes

            // Use story points for comparison if estimated time set on the issue is too low
            // (on some issues we forget to set an estimate in hours as well as Story Points)
            //fiftyPercentLimit = estimatedTime > storyPointsInMinutes ? estimatedTime * 0.5 : storyPointsInMinutes * 0.5;
            //seventyFivePercentLimit = estimatedTime > storyPointsInMinutes ? estimatedTime * 0.75 : storyPointsInMinutes * 0.75;
            //overTimeLimit = estimatedTime > storyPointsInMinutes ? estimatedTime : storyPointsInMinutes;
            
            fiftyPercentLimit = estimatedTime * 0.5;
            seventyFivePercentLimit = estimatedTime * 0.75;
            overTimeLimit = estimatedTime;

            if (timeSpent > overTimeLimit) {
                markIssue.call(this, COLOR_100_PERCENT_SPENT);
            }
            else if (timeSpent >= seventyFivePercentLimit) {
                markIssue.call(this, COLOR_75_PERCENT_SPENT);
            }
            else if (timeSpent >= fiftyPercentLimit) {
                markIssue.call(this, COLOR_50_PERCENT_SPENT);
            }
            else {
                unmarkIssue.call(this);
            }
        });
    }

    function markIssue(color) {
        var $storyPointBadge = $(this).find('.aui-badge');

        $(this).css({
            'background': color
        });

        $(this).find('.ghx-end').css({
            'background': color,
            'box-shadow': '-4px 0 3px ' + color + ', 0 -3px 3px ' + color
        });

        $storyPointBadge.css({
            'color': 'rgba(255,255,255,0.9)'
        });
    }

    function unmarkIssue() {
        $(this).removeAttr('style');
        $(this).find('.ghx-end').removeAttr('style');
        $(this).find('.aui-badge').removeAttr('style');
    }

    function addToggleButton() {
        var $button = $('<button id="colors-visible" class="aui-button aui-button-primary aui-style" data-colors-visible="1">Hide warning colors</button>');

        $(document).on('click', '#colors-visible', toggleColorsVisibilty);

        $('#ghx-modes-tools').prepend($button);
    }

    function toggleColorsVisibilty() {
        var $issues = $('.js-issue'),
            colorsVisible = parseInt($(this).data('colorsVisible'));

        if (colorsVisible) {
            $(this).text('Show warning colors');

            $issues.each(function () {
                unmarkIssue.call(this);
            });
        }
        else {
            $(this).text('Hide warning colors');

            markOverTimeIssues($issues);
        }

        $(this).data('colorsVisible', +!colorsVisible); // Toggle visibility
    }

    function addStoryPointHourField() {
        var value = $.cookie(COOKIE_NAME) || 8,
            InputStyles = [
            'background: rgba(0, 0, 0, 0.15);',
            'border-radius: 3px;',
            'box-shadow: none;',
            'color: rgba(255, 255, 255, 0.6);',
            'height: 30px;',
            '-moz-appearance: textfield;',
            '-webkit-appearance: textfield;',
            'border: none;',
            'box-sizing: border-box;',
            'color: #000;',
            'width: 35px;',
            'padding: 2px 10px;',
            'margin: 0 5px;',
            'vertical-align: baseline;'
        ].join('');

        var $field = $(
            '<div style="display: inline-block; margin-right: 10px;">' +
                '<span>1 story point = </span>' +
                '<input type="text" id="story-point-hours" style="' + InputStyles + '" value="' + value + '" title="Amount of hours 1 story point should equal" />' +
                '<span>hours</span>' +
            '</div>'
        );

        var onChange = debounce(storyPointValueChanged, 200);
        $(document).on('change', '#story-point-hours', onChange);

        $('#ghx-modes-tools').prepend($field);
    }

    function storyPointValueChanged() {
        var newValue = parseInt($(this).val()) || 0;

        if(newValue !== _STORY_POINT_IN_HOURS) {
            _STORY_POINT_IN_HOURS = newValue;
            markOverTimeIssues($('.js-issue'));
            updateStoryPointCookie(newValue);
        }
    }

    function updateStoryPointCookie(value) {
        $.cookie(COOKIE_NAME, value, {expires: 7, path: '/'});
    }

    /**
     * Takes a string in the format of "00h 00m" and converts it to {Number} minutes
     * @param {String} timeString
     */
    function getAsMinutesFromTimeString(timeString) {
        var parts,
            hours,
            minutes;

        if (!timeString || !timeString instanceof String) {
            console.log('MARK ISSUES PLUGIN: Expected argument to be a String, got: ' + timeString);
            return 0;
        }

        parts = timeString.toLowerCase().split(' ');
        hours = parseFloat(parts[0].replace('h', '')) || 0;
        minutes = parts.length > 1 ? parseFloat(parts[1].replace('m', '')) : 0;

        return (hours * 60) + minutes;
    }

    // Shamelessly stolen from Underscore.js
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }


})(jQuery);
