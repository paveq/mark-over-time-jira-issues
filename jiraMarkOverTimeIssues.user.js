// ==UserScript==
// @name                Jira Mark Over time issues
// @namespace	        jira
// @description	        Adds a red background color to the issues that are at risk of going over the estimated time
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @include		http://jira.*
// @include		https://jira.*
// ==/UserScript==

// TODO: [FEATURE] Write comment to PO that the issue is going over time
(function ($) {
    // Constants
    var COLOR_50_PERCENT_SPENT = '#FFF189',
        COLOR_75_PERCENT_SPENT = '#FFBD67',
        COLOR_100_PERCENT_SPENT = '#FF6464',
        STORY_POINT_IN_MINUTES = 8 * 60;

    // Init script
    $(document).ready(function ($) {
        // We need to wait for all the issues to load into the DOM. I think they're loaded with AJAX or something...
        setTimeout(function pollForIssuesLoaded() {
            var $issues = $('.js-issue');

            if ($issues.length > 0) {
                addToggleButton();
                markOverTimeIssues($issues);
            }
            else {
                console.log('Waiting for the board to be fully loaded into the DOM...');
                pollForIssuesLoaded();
            }
        }, 30);
    });

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
            hundredPercentLimit;

        // Go through all the issues on the board
        $issues.each(function () {
            $metadata = $(this).find('.ghx-extra-field-content');
            $estimate = $($metadata[0]);
            $timeSpent = $($metadata[1]);
            $storyPointBadge = $(this).find('.aui-badge');
            storyPointsInMinutes = parseInt($storyPointBadge.text()) * STORY_POINT_IN_MINUTES || 0; // Convert Story Points to minutes

            estimatedTime = getAsMinutesFromTimeString($estimate.text());
            timeSpent = getAsMinutesFromTimeString($timeSpent.text());

            // Use story points for comparison if estimated time set on the issue is too low
            // (on some issues we forget to set an estimate in hours as well as Story Points)
            fiftyPercentLimit = estimatedTime > storyPointsInMinutes ? estimatedTime * 0.5 : storyPointsInMinutes * 0.5;
            seventyFivePercentLimit = estimatedTime > storyPointsInMinutes ? estimatedTime * 0.75 : storyPointsInMinutes * 0.75;
            hundredPercentLimit = estimatedTime > storyPointsInMinutes ? estimatedTime : storyPointsInMinutes;

            if (timeSpent >= hundredPercentLimit) {
                markIssue.call(this, COLOR_100_PERCENT_SPENT);
            }
            else if (timeSpent >= seventyFivePercentLimit) {
                markIssue.call(this, COLOR_75_PERCENT_SPENT);
            }
            else if (timeSpent >= fiftyPercentLimit) {
                markIssue.call(this, COLOR_50_PERCENT_SPENT);
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

    /**
     * Takes a string in the format of "00h 00m" and converts it to {Number} minutes
     * @param {String} timeString
     */
    function getAsMinutesFromTimeString(timeString) {
        var parts,
            hours,
            minutes;

        if (!timeString instanceof String) {
            return timeString;
        }

        parts = timeString.toLowerCase().split(' ');
        hours = parseInt(parts[0].replace('h', '')) || 0;
        minutes = parts.length > 1 ? parseInt(parts[1].replace('m', '')) : 0;

        return (hours * 60) + minutes;
    }
})(jQuery);