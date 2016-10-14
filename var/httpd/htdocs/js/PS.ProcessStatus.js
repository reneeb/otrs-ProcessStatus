// --
// Copyright (C) 2016 Perl-Services.de, http://perl-services.de
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file COPYING for license information (AGPL). If you
// did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
// --

/*global jsPlumb, LabelSpacer */

"use strict";

var PS = PS || {};

PS.ProcessStatus = (function (TargetNS) {

    var Elements = {},
        ActivityBoxHeight = 80;

    function GetCanvasSize($Element) {
        var MinWidth = 500,
            MinHeight = 500,
            MaxWidth = 0,
            MaxHeight = 0,
            ScreenWidth;

        // Find maximum X and maximum Y value in Layout config data.
        // This data was saved the last time the process was edited
        // it is possible to extend the canvas for larger drawings.
        // The minimum width is based on the available space (screen resolution)

        // Get width of surrounding element (possible canvas width)
        ScreenWidth = $Element.width();

        // Loop through available elements and find max needed width and height
        $.each(Core.Config.Get('Config.ProcessLayout'), function (Key, Value) {
            var Left = parseInt(Value.left, 10),
                Top = parseInt(Value.top, 10);

            if (Left > MaxWidth) {
                MaxWidth = Left + 110;
            }
            if (Top > MaxHeight) {
                MaxHeight = Top + ActivityBoxHeight;
            }
        });

        // Width should always be at least the screen width
        if (ScreenWidth > MaxWidth) {
            MaxWidth = ScreenWidth;
        }

        // The canvas should always have at least a minimum size
        if (MinWidth > MaxWidth) {
            MaxWidth = MinWidth;
        }
        if (MinHeight > MaxHeight) {
            MaxHeight = MinHeight;
        }

        return {
            Width: MaxWidth,
            Height: MaxHeight
        };
    }

    TargetNS.CreateStartEvent = function (PosX, PosY) {
        var DefaultX = 30,
            DefaultY = 30;

        PosX = PosX || DefaultX;
        PosY = PosY || DefaultY;

        $('#Canvas').append('<div id="StartEvent"></div>').find('#StartEvent').css({
            'top': PosY + 'px',
            'left': PosX + 'px'
        });
    };

    TargetNS.CreateActivity = function (EntityID, EntityName, ActivityID, PosX, PosY) {

        var ActiveActivity        = $('#ActivityEntityID').val();
        var ActiveBackgroundColor = Core.Config.Get('ProcessStatus.ActiveBackground');

        var Background = '#ffffff';
        if ( ActiveActivity == EntityID && typeof( ActiveBackgroundColor ) !== "undefined" ) {
            Background = ActiveBackgroundColor;
        }

        var EntityNameHeight,
            $EntityBox;

        $('#Canvas')
            .append('<div class="Activity Task" id="' + Core.App.EscapeHTML(EntityID) + '"><span>' + Core.App.EscapeHTML(EntityName) + '</span><div class="TaskTypeIcon"><i class="fa fa-user fa-lg"></i></div><div class="Icon Loader"></div><div class="Icon Success"></div></div>')
            .find('#' + EntityID)
            .css({
                'top': PosY + 'px',
                'left': PosX + 'px',
                'background-color' : Background
            })
            .bind('mouseenter.Activity', function() {
                TargetNS.ShowActivityTooltip($(this));
                $(this).addClass('Hovered');
            })
            .bind('mouseleave.Activity', function() {
                $('#DiagramTooltip').hide();
                $(this).removeClass('Hovered');
            });

        // Correct placing of activity name within box
        $EntityBox = $('#' + EntityID);
        EntityNameHeight = $EntityBox.find('span').height();
        $EntityBox.find('span').css('margin-top', parseInt((ActivityBoxHeight - EntityNameHeight) / 2, 10));

        // Add the Activity to our list of elements
        Elements[EntityID] = $('#' + EntityID);
    };

    TargetNS.CreateActivityDummy = function (StartActivityID) {
        var StartActivityPosition, DummyPosition, CanvasSize = {};

        if ($('#Dummy').length) {
            $('#Dummy').remove();
        }

        CanvasSize.width = $('#Canvas').width();
        CanvasSize.height = $('#Canvas').height();

        // get position of start activity to calculate position of dummy
        StartActivityPosition = $('#' + StartActivityID).position();
        DummyPosition = StartActivityPosition;
        DummyPosition.top += 120;
        DummyPosition.left += 150;

        // check if DummyPosition is out of canvas and correct position
        if ((CanvasSize.width - 85) <= DummyPosition.left) {
            DummyPosition.left -= 250;
        }
        if ((CanvasSize.height - 115) <= DummyPosition.top) {
            DummyPosition.top -= 240;
        }

        $('#Canvas').append('<div class="Activity" id="Dummy"><span>Dummy</span></div>').find('#Dummy').css({
            top: DummyPosition.top,
            left: DummyPosition.left
        });
    };

    TargetNS.ShowTransitionTooltip = function (Connection, StartActivity) {
        var $Tooltip = $('#DiagramTooltip'),
            $Element = $(Connection.canvas),
            $TitleElement = $Element.clone(),
            text,
            position = { x: 0, y: 0},
            Transition = TargetNS.ProcessData.Transition,
            ElementID = $TitleElement.find('span').attr('id'),
            CurrentProcessEntityID = $('#ProcessEntityID').val(),
            PathInfo = TargetNS.ProcessData.Process[CurrentProcessEntityID].Path,
            AssignedTransitionActions = [],
            CanvasWidth, CanvasHeight,
            TooltipWidth, TooltipHeight;

        $TitleElement.find('a').remove();
        text = '<h4>' + Core.App.EscapeHTML($TitleElement.text()) + '</h4>';

        if (typeof Transition[ElementID] === 'undefined') {
            return false;
        }

        if (!$Tooltip.length) {
            $Tooltip = $('<div id="DiagramTooltip"></div>').css('display', 'none').appendTo('#Canvas');
        }
        else if ($Tooltip.is(':visible')) {
            $Tooltip.hide();
        }

        $.each(PathInfo, function(Activity, TransitionObject) {
            if (Activity === StartActivity && typeof TransitionObject[ElementID] !== 'undefined' && typeof TransitionObject[ElementID].TransitionAction !== 'undefined') {
                AssignedTransitionActions = TransitionObject[ElementID].TransitionAction;
                return false;
            }
        });

        // Add content to the tooltip
        text += "<ul>";
        if (AssignedTransitionActions.length) {
            $.each(AssignedTransitionActions, function (Key, Value) {
                text += "<li>" + Core.App.EscapeHTML(TargetNS.ProcessData.TransitionAction[Value].Name) + "</li>";
            });
        }
        else {
            text += '<li class="NoDialogsAssigned">Test' + TargetNS.Localization.NoTransitionActionsAssigned + '</li>';
        }
        text += "</ul>";

        $Tooltip.html(text);

        // calculate tooltip position
        // x: x-coordinate of canvas + x-coordinate of element within canvas + width of element
        //position.x = parseInt($Element.css('left'), 10) + parseInt($Element.width(), 10) + 30;
        //
        // y: y-coordinate of canvas + y-coordinate of element within canvas + height of element
        //position.y = parseInt($Element.css('top'), 10) + 15;

        // calculate tooltip position
        // if activity box is at the right border of the canvas, switch tooltip to the left side of the box
        CanvasWidth = $('#Canvas').width();
        TooltipWidth = $Tooltip.width();

        // If activity does not fit in canvas, generate tooltip on the left side
        if (CanvasWidth < (parseInt($Element.css('left'), 10) + parseInt($Element.width(), 10) + TooltipWidth)) {
            // x: x-coordinate of element within canvas - width of tooltip
            position.x = parseInt($Element.css('left'), 10) - TooltipWidth - 5;
        }
        // otherwise put tooltip on the right side (default behaviour)
        else {
            // x: x-coordinate of canvas + x-coordinate of element within canvas + width of element
            position.x = parseInt($Element.css('left'), 10) + parseInt($Element.width(), 10) + 40;
        }

        // if activity box is at the bottom border of the canvas, set tooltip y-coordinate to the top as far as needed
        CanvasHeight = $('#Canvas').height();
        TooltipHeight = $Tooltip.height();

        // y-coordinate
        if (parseInt($Element.css('top'), 10) + TooltipHeight + 15 > CanvasHeight) {
            position.y = CanvasHeight - TooltipHeight - 15;
        }
        else {
            position.y = parseInt($Element.css('top'), 10) + 15;
        }

        $Tooltip
            .css('top', position.y)
            .css('left', position.x)
            .show();
    };

    TargetNS.ShowActivityTooltip = function ($Element) {
        var $Tooltip = $('#DiagramTooltip'),
            text = '<h4>' + Core.App.EscapeHTML($Element.find('span').text()) + '</h4>',
            position = {x: 0, y: 0},
            Activity = TargetNS.ProcessData.Activity,
            ActivityDialogs,
            CanvasWidth,
            CanvasHeight,
            TooltipWidth,
            TooltipHeight;

        if (typeof Activity[$Element.attr('id')] === 'undefined') {
            return false;
        }

        ActivityDialogs = Activity[$Element.attr('id')].ActivityDialog;

        if (!$Tooltip.length) {
            $Tooltip = $('<div id="DiagramTooltip"></div>').css('display', 'none').appendTo('#Canvas');
        }
        else if ($Tooltip.is(':visible')) {
            $Tooltip.hide();
        }

        // Add content to the tooltip
        text += "<ul>";
        if (ActivityDialogs) {
            $.each(ActivityDialogs, function (Key, Value) {
                var Interfaces = TargetNS.ProcessData.ActivityDialog[Value].Interface,
                    SelectedInterface = '';

                $.each(Interfaces, function (InterfaceKey, InterfaceValue) {
                    if (SelectedInterface.length) {
                        SelectedInterface += '/';
                    }
                    SelectedInterface += InterfaceValue.substr(0, 1);
                });
                text += "<li><span class=\"AvailableIn\">" + SelectedInterface + "</span> " + Core.App.EscapeHTML(TargetNS.ProcessData.ActivityDialog[Value].Name) + " </li>";
            });
        }
        else {
            text += '<li class="NoDialogsAssigned">' + TargetNS.Localization.NoDialogsAssigned + '</li>';
        }

        text += "</ul>";

        $Tooltip.html(text);

        // calculate tooltip position
        // if activity box is at the right border of the canvas, switch tooltip to the left side of the box
        CanvasWidth = $('#Canvas').width();
        TooltipWidth = $Tooltip.width();

        // If activity does not fit in canvas, generate tooltip on the left side
        if (CanvasWidth < (parseInt($Element.css('left'), 10) + parseInt($Element.width(), 10) + TooltipWidth)) {
            // x: x-coordinate of element within canvas - width of tooltip
            position.x = parseInt($Element.css('left'), 10) - TooltipWidth - 10;
        }
        // otherwise put tooltip on the right side (default behaviour)
        else {
            // x: x-coordinate of canvas + x-coordinate of element within canvas + width of element
            position.x = parseInt($Element.css('left'), 10) + parseInt($Element.width(), 10) + 15;
        }

        // if activity box is at the bottom border of the canvas, set tooltip y-coordinate to the top as far as needed
        CanvasHeight = $('#Canvas').height();
        TooltipHeight = $Tooltip.height();

        // y-coordinate
        if (parseInt($Element.css('top'), 10) + TooltipHeight + 10 > CanvasHeight) {
            position.y = CanvasHeight - TooltipHeight - 10;
        }
        else {
            position.y = parseInt($Element.css('top'), 10) + 10;
        }

        $Tooltip
            .css('top', position.y)
            .css('left', position.x)
            .show();
    };

    TargetNS.SetStartActivity = function (EntityID) {

        // Not more than one StartActivity allowed, function does not check this!
        // After the initialization of the canvas, an automatic setting of the StartActivity is not useful
        // Only the user can change this by moving the arrow
        if (typeof Elements[EntityID] !== 'undefined') {

            // Create the connection from StartEvent to StartActivity
            // We don't create the Endpoints here, because every Activity
            // creates its own Endpoint on CreateActivity()
            jsPlumb.connect({
                source: 'StartEvent',
                target: EntityID,
                anchor: 'Continuous',
                endpoint: 'Blank',
                detachable: true,
                reattach: true
            });
        }
    };

    TargetNS.LastTransitionDetails = {};

    TargetNS.CreateTransition = function (StartElement, EndElement, EntityID, TransitionName) {

        var Config = TargetNS.ProcessData,
            ProcessEntityID = $('#ProcessEntityID').val(),
            StartActivity, EndActivity, Connection,
            PopupPath;

        StartActivity = Elements[StartElement];
        if (EndElement === "Dummy") {
            EndActivity = $('#Dummy').attr('id');
        }
        else {
            EndActivity = Elements[EndElement];
        }

        if ((typeof StartActivity === 'undefined') || (typeof EndActivity === 'undefined')) {
            return false;
        }

        // Get TransitionName from Config
        if (typeof TransitionName === 'undefined') {
            if (Config.Transition && Config.Transition[EntityID]) {
                TransitionName = Config.Transition[EntityID].Name;
            }
            else {
                TransitionName = 'NoName';
            }
        }

        PopupPath = Core.Config.Get('Config.PopupPathPath') + "ProcessEntityID=" + ProcessEntityID + ";TransitionEntityID=" + EntityID + ";StartActivityID=" + StartElement;

        Connection = jsPlumb.connect({
            source: StartActivity,
            target: EndActivity,
            anchor: 'Continuous',
            endpoints: [
                "Blank",
                [ 'Dot', { radius: 7, hoverClass: 'EndpointHover' } ]
            ],
            endpointStyle: { fillStyle: '#000' },
            detachable: true,
            reattach: true,
            overlays: [
                [ "Diamond", { location: 18, width: 15, length: 25, paintStyle: { fillStyle: '#FFF', outlineWidth: 1, outlineColor: '#000'} } ],
                [ "Label", { label: '<span id="' + EntityID + '" title="' + Core.App.EscapeHTML(TransitionName) + '">' + Core.App.EscapeHTML(TransitionName) + '</span>', location: 0.5, cssClass: 'TransitionLabel', id: 'label', events: {
                    mouseenter: function(labelOverlay, originalEvent) {
                        TargetNS.LastTransitionDetails = {
                            LabelOverlay: labelOverlay,
                            StartElement: StartElement,
                            EndElement: EndElement
                        };
                        TargetNS.HighlightTransitionLabel(labelOverlay, StartElement, EndElement);
                        originalEvent.stopPropagation();
                        return false;
                    },
                    mouseleave: function(labelOverlay, originalEvent) {
                        TargetNS.UnHighlightTransitionLabel(labelOverlay);
                        originalEvent.stopPropagation();
                        return false;
                    }
                }}]
            ],
            parameters: {
                TransitionID: EntityID
            }
        });

        Connection.bind('mouseenter', function () {
            var Overlay = Connection.getOverlay('label');

            // add class to label
            if (Overlay) {
                $(Overlay.canvas).addClass('Hovered');
            }
        });

        Connection.bind('mouseleave', function () {
            var Overlay = Connection.getOverlay('label');

            // remove hover class from label
            if (Overlay) {
                $(Overlay.canvas).removeClass('Hovered');
            }
        });

    };

    TargetNS.HighlightTransitionLabel = function(Connection, StartActivity, EndActivity) {

        var Config = TargetNS.ProcessData,
            ProcessEntityID = $('#ProcessEntityID').val(),
            Path = Config.Process[ProcessEntityID].Path,
            TransitionEntityID = Connection.component.getParameter('TransitionID'),
            StartActivityID = Connection.component.sourceId,
            PopupPath = Core.Config.Get('Config.PopupPathPath') + "ProcessEntityID=" + ProcessEntityID + ";TransitionEntityID=" + TransitionEntityID + ";StartActivityID=" + StartActivityID,
            SessionData = Core.App.GetSessionInformation();

        // highlight label
        $(Connection.canvas).addClass('Hovered');
        Connection.component.setPaintStyle({ strokeStyle: "#FF9922", lineWidth: '2' });

        // show tooltip with assigned transition actions
        TargetNS.ShowTransitionTooltip(Connection, StartActivity);
    };

    TargetNS.UnHighlightTransitionLabel = function(Connection) {
        $('#DiagramTooltip').hide();
        $(Connection.canvas).removeClass('Hovered');
        Connection.component.setPaintStyle({ strokeStyle: "#000", lineWidth: '2' });
    };

    TargetNS.DrawDiagram = function () {
        var Config = TargetNS.ProcessData,
            Layout = TargetNS.ProcessLayout,
            ProcessEntityID = $('#ProcessEntityID').val(),
            StartActivity = Config.Process[ProcessEntityID].StartActivity;

        // Set some jsPlumb defaults
        jsPlumb.importDefaults({
            Connector: [ 'Flowchart', { curviness: 0, margin: -1, showLoopback: false } ],
            PaintStyle: { strokeStyle: "#000", lineWidth: 2 },
            HoverPaintStyle: { strokeStyle: "#FF9922", lineWidth: 2 },
            ConnectionOverlays: [
                [ "PlainArrow", { location: -15, width: 20, length: 15 } ]
            ]
        });

        // Always start with drawing the start event element
        TargetNS.CreateStartEvent();

        // Draw all available Activities (Keys of the ProcessData-Path)
        $.each(Config.Process[ProcessEntityID].Path, function (Key) {
            if (typeof Layout[Key] !== 'undefined') {
                TargetNS.CreateActivity(Key, Config.Activity[Key].Name, Config.Activity[Key].ID, Layout[Key].left, Layout[Key].top);
            }
            else {
                Core.Exception.Throw('Error: Activity without Layout Position!', 'ProcessError');
            }
        });

        // Start Activity
        if (typeof StartActivity !== 'undefined') {
            TargetNS.SetStartActivity(StartActivity);
        }

        // Now draw the Transitions
        $.each(Config.Process[ProcessEntityID].Path, function (Key, Value) {
            var StartActivityID = Key,
                TransitionID, EndActivityID,
                TransitionHash = Value;

            if (typeof TransitionHash !== 'undefined') {
                $.each(TransitionHash, function (TransitionKey, TransitionValue) {
                    TransitionID = TransitionKey;
                    // if EndActivity available, draw transition directly
                    if (typeof TransitionValue !== 'undefined') {
                        EndActivityID = TransitionValue.ActivityEntityID;
                        TargetNS.CreateTransition(StartActivityID, EndActivityID, TransitionID);
                    }

                    // if EndActivity is undefined draw transition with dummy
                    else {

                        // Create dummy activity to use for initial transition
                        TargetNS.CreateActivityDummy(StartActivityID);

                        // Create transition between this Activity and DummyElement
                        TargetNS.CreateTransition(StartActivityID, 'Dummy', TransitionID);

                        // Remove Connection to DummyElement and delete DummyElement again
                        TargetNS.RemoveActivityDummy();
                    }
                });
            }
        });

        $('div.TransitionLabel')
            .delegate('a.Delete, a.Edit, span', 'mouseenter', function () {
                TargetNS.HighlightTransitionLabel(TargetNS.LastTransitionDetails.LabelOverlay, TargetNS.LastTransitionDetails.StartElement, TargetNS.LastTransitionDetails.EndElement);
            })
            .delegate('a.Delete, a.Edit, span', 'mouseleave', function () {
                TargetNS.UnHighlightTransitionLabel(TargetNS.LastTransitionDetails.LabelOverlay);
            });
    };

    TargetNS.Redraw = function () {
        $('#ShowEntityIDs').removeClass('Visible').text(TargetNS.Localization.ShowEntityIDs);
        jsPlumb.reset();
        $('#Canvas').empty();
        TargetNS.Init();
    };

    TargetNS.Extend = function (CanvasSize) {
        var CanvasWidth,
            CanvasHeight;

        if (typeof CanvasSize !== 'undefined') {

            CanvasWidth = $('#Canvas').width() + parseInt(CanvasSize.Width, 10);
            CanvasHeight = $('#Canvas').height() + parseInt(CanvasSize.Height, 10);

            $('#Canvas').width(CanvasWidth).height(CanvasHeight);
        }
    };

    TargetNS.Init = function () {
        var CanvasSize = GetCanvasSize($('#Canvas')),
            CanvasWidth = CanvasSize.Width,
            CanvasHeight = CanvasSize.Height,
            CanvasLabelSpacer;

        TargetNS.ProcessData = {
            Process: Core.Config.Get('Config.Process'),
            Activity: Core.Config.Get('Config.Activity'),
            ActivityDialog: Core.Config.Get('Config.ActivityDialog'),
            Transition: Core.Config.Get('Config.Transition'),
            TransitionAction: Core.Config.Get('Config.TransitionAction')
        };

        TargetNS.ProcessLayout = Core.Config.Get('Config.ProcessLayout');

        // set the width and height of the drawing canvas,
        // based on the saved layout information (if available)
        $('#Canvas').width(CanvasWidth).height(CanvasHeight);

        // reset, because at this point (initial draw or redraw), there cannot be a saved connection
        TargetNS.LatestConnectionTransitionID = undefined;

        // init label spacer
        CanvasLabelSpacer = new LabelSpacer();
        CanvasLabelSpacer.reset();

        // init binding to connection changes
        jsPlumb.bind('connection', function(Data) {
            var Config = TargetNS.ProcessData,
                ProcessEntityID = $('#ProcessEntityID').val(),
                Path = Config.Process[ProcessEntityID].Path,
                TransitionID;

            // check if we need to register a new StartActivity
            if (Data.sourceId === 'StartEvent') {
                Config.Process[ProcessEntityID].StartActivity = Data.targetId;
            }

            // in case the target is the dummy, its a whole new transition
            // and we need to mark it as "to be connected", so the user will
            // see that there is something to do with it
            else if (Data.targetId === 'Dummy') {
                Data.connection.setPaintStyle({ strokeStyle: "red", lineWidth: 4 });
                Data.targetEndpoint.setPaintStyle({ fillStyle: "red" });
            }
            else if (Data.targetId === Data.sourceId) {
                return false;
            }
            // otherwise, an existing transition has been (re)connected
            else {
                // get TransitionID
                TransitionID = Data.connection.getParameter('TransitionID');

                // Fallback: try to get the ID from the earlier saved variable, if it cannot be retrieved from the connection
                if (typeof TransitionID === 'undefined') {
                    TransitionID = TargetNS.LatestConnectionTransitionID;
                }

                // set new Path
                // this event also fires on the initial drawing of the diagram
                // we have to make sure, that existing data is not overwritten
                // if the config entry already exists, there is no need to redefine it
                if (typeof Path[Data.sourceId][TransitionID] === 'undefined') {
                    Path[Data.sourceId][TransitionID] = {
                        ActivityEntityID: Data.targetId
                    };
                }
                else if (Path[Data.sourceId][TransitionID].ActivityEntityID !== Data.targetId) {
                    Path[Data.sourceId][TransitionID].ActivityEntityID = Data.targetId;
                }

                // set connection style to blackagain (if it was red before)
                Data.connection.setPaintStyle({ strokeStyle: "#000", lineWidth: 2 });
                Data.targetEndpoint.setPaintStyle({ fillStyle: "#000" });
            }
        });

        // init event to save transition ID, because information is lost while re-connecting connections
        jsPlumb.bind('beforeDrop', function(Data) {
           TargetNS.LatestConnectionTransitionID = Data.connection.getParameter('TransitionID');
           return true;
        });

        TargetNS.DrawDiagram();
    };

    return TargetNS;
}(PS.ProcessStatus || {}));

/*jslint nomen: true*/
