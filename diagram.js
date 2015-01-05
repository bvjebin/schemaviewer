(function () {
    'use strict';
    /*
        @ClassName Diagram
        @params el: id of the container
        @return this
    */
    function Diagram(el) {
        /*
            Height and width of tables must be fixed
        */
        var _el = document.getElementById(el),
            _data, instance = this,
            renderTable,
            drawConnection,
            attributeHeight = 25,
			numberofVisibleAttributes = 8,
            tableWidth = 200,
            tableHeight = attributeHeight * numberofVisibleAttributes,
			pathStartEndPointOffset = 15,
			width = $(_el).width(),
			height = $(_el).height(),
            availableHeight = height,
            availableWidth = width,
            centerXPoint = (availableWidth/2),
            centerYPoint = (availableHeight/2),
			laneWidth = 100,
            //will be set to 8 when number of ellipse is > 2
            maxTableCountPerEllipse = 4, getPositionByAngle,
            layoutInfo, setTablePosition, tablePositions = {},
			usedHorizontalLanePixels = [],
			xpointsOnVerticalLane = [34, 16, 25, 30, 20, 32, 18, 27, 23, 28, 24, 33, 17, 31, 19, 29, 21, 26, 22],
			connectionAttributeStack = [], connectionWidth = 2, connectionHighlightWidth = 3, connectionColor = "#59A95F", 
			connectionHighlightColor = "#59A95F", sourceColor = "#59A95F", targetColor = "#59A95F", tooltipConf, $tooltip;
		
		//tooltip wrapper insertion
		$(_el).append("<div id='connection_tooltip' class='connection_tooltip'></div>");
		$('#connection_tooltip').css({position: "absolute", maxHeight: "100px", width: "200px"});
		$tooltip = $('#connection_tooltip');
		
		tooltipConf = {
			node: d3.select("#connection_tooltip")
		};
		
		this.addConnection = function(event) {
			if(connectionAttributeStack.length === 0) {
				connectionAttributeStack.push(event.target.id);
				$(event.target).addClass("do-select");
			} else if(connectionAttributeStack.length === 1) {
				connectionAttributeStack.push(event.target.id);
				this.drawConnection(connectionAttributeStack[0], connectionAttributeStack[1]);
				$("#"+connectionAttributeStack[0]).removeClass("do-select");
				connectionAttributeStack.length = 0;
			}
		}
		
		this.deleteConnection = function(target) {
			var ids = target.id.split("___");
			document.getElementById(ids[0]).style.backgroundColor = "";
			$(document.getElementById(ids[0])).removeClass('source-attr');
			$(document.getElementById(ids[1])).removeClass('target-attr');
			document.getElementById(ids[1]).style.backgroundColor = "";
			target.parentNode.remove();
			$tooltip.css("z-index", -1).velocity({opacity: 0});
		}
		
		this.tooltipHtml = function(target) {
			var tableSourceName = $("#"+target.classList[0]+" .title").text(),
				tableTargetName = $("#"+target.classList[1]+" .title").text(),
				attrs = target.classList[2].split("___"),
				sourceAttrName = $("#"+attrs[0]).text(), targetAttrName = $("#"+attrs[1]).text();
				
			return "<strong>"+tableSourceName+"."+sourceAttrName+"</strong><br /> is connected to <br /><strong>"+tableTargetName+"."+targetAttrName+"</strong><br><em>Click on the line to delete</em>";
		};
        
        this.drawConnection = function(source, target) {
			if(document.getElementById(source) == null || document.getElementById(target) == null) {
				return false;
			}
            var _this = this,
				$source = $('#'+source), 
                $target = $("#"+target),
				$sourceParent = $source.parents(".entity"),
				$targetParent = $target.parents(".entity"),
				orbitDistance = Math.abs($sourceParent.attr("data-orbitindex") - $targetParent.attr("data-orbitindex")),
                sourceParentPosition = $sourceParent.position(),
                targetParentPosition = $targetParent.position(),
                sourcePositionTop = $source.position().top + $source.parents(".attributesList").scrollTop(), //relative to attributesList
                targetPositionTop = $target.position().top + $target.parents(".attributesList").scrollTop(), //relative to attributesList
                direction = [], svgHeight, svgWidth, svgPosX, svgPosY, sourceConnectionSide, targetConnectionSide,
                lineFunction = d3.svg.line()
                                    .x(function(d) {
                                        d || (d = {});
                                        return d.x || 0;
                                    })
                                    .y(function(d) {
                                        d || (d = {});
                                        return d.y || 0;
                                    })
                                    .interpolate("linear");
			if(targetParentPosition.left == sourceParentPosition.left) {
				direction.push("v");
			} else if(targetParentPosition.top == sourceParentPosition.top) {
				direction.push("h");
			}
            
            if(targetParentPosition.left > sourceParentPosition.left) {
                sourceParentPosition.left = sourceParentPosition.left + tableWidth;
				direction.push("e");
            } else {
                targetParentPosition.left = targetParentPosition.left + tableWidth;
                direction.push("w");
            }
			
			if(targetParentPosition.top >= (sourceParentPosition.top)) {
				direction.push("s");
			} else {
				direction.push("n");
			}

            svgWidth = Math.abs(targetParentPosition.left - sourceParentPosition.left);
            svgHeight = getSvgHeight();
            
			function getSvgHeight() {
				var topOfelementWithLowTopValue, bottomValue;
				if(targetParentPosition.top >= sourceParentPosition.top) {
					topOfelementWithLowTopValue = sourceParentPosition.top;
					bottomValue = targetParentPosition.top + tableHeight + laneWidth;
				} else {
					topOfelementWithLowTopValue = targetParentPosition.top;
					bottomValue = sourceParentPosition.top + tableHeight + laneWidth;
				}
				return Math.abs(topOfelementWithLowTopValue - bottomValue); //assuming 100px gap will be there between every table
			}
			
			if(direction.indexOf("e") != -1) {
                svgPosX = sourceParentPosition.left;
                svgPosY = targetParentPosition.top;
				sourceConnectionSide = "right";
				targetConnectionSide = "left";
            } else if(direction.indexOf("w") != -1) {
                svgPosX = targetParentPosition.left;
                svgPosY = targetParentPosition.top;
				sourceConnectionSide = "left";
				targetConnectionSide = "right";
            }
            if(direction.indexOf("s") != -1) {
                svgPosY = sourceParentPosition.top;
            }
            
            $source.css("background-color", sourceColor).data("role", "source").addClass('source-attr');
            $target.css("background-color", targetColor).data("role", "target").addClass('target-attr');
            var svg = d3.select(_el)
                .append("svg")
                .attr("class", $sourceParent[0].id+ " " +$targetParent[0].id + " " + source+"___"+target)
                .style("position", "absolute")
                .style("top", svgPosY)
                .style("left", svgPosX)
                .attr("height", svgHeight)
				.attr("pointer-events", "none")
                .attr("width", svgWidth)
				.on("mouseenter", function() {
					$("svg path").css("opacity", 0.3);
					var svg = d3.select(this);
					svg.style("z-index", 1);
					svg.selectAll("."+source+"___"+target)
						.attr("stroke-width", connectionHighlightWidth)
						.style("opacity", 1)
						.attr("stroke", connectionHighlightColor);
					
					svg.selectAll("#"+source+"___"+target+"_gp").selectAll("path")
						.attr("stroke", connectionHighlightColor)
						.style("opacity", 1)
						.attr("fill", connectionHighlightColor);
					
					var html = _this.tooltipHtml(this);
					$tooltip.css("z-index", 500).velocity({"opacity": 1}, {queue: false});
					tooltipConf.node.html(html).style("left", function() {
						var pos = positionTooltip({
								x: (d3.event.pageX + 20),
								y: d3.event.pageY
							});
						return (pos.left + 10) + 'px';
					}).style("top", function() {
						var pos = positionTooltip({
								x: (d3.event.pageX + 20),
								y: d3.event.pageY
							});
						return (pos.top - 10) + 'px';
					});
				})
				.on("mousemove", function() {
					tooltipConf.node.style("left", function() {
						var pos = positionTooltip({
							x: (d3.event.pageX + 20),
							y: d3.event.pageY
						});
						return (pos.left + 10) + 'px';
					}).style("top", function() {
						var pos = positionTooltip({
							x: (d3.event.pageX + 20),
							y: d3.event.pageY
						});
						return (pos.top - 10) + 'px';
					});
				})
				.on("mouseleave", function() {
					var svg = d3.select(this);
					svg.style("z-index", 0);
					svg.selectAll("."+source+"___"+target)
						.attr("stroke-width", connectionWidth)
						.attr("stroke", connectionColor);
					
					svg.selectAll("#"+source+"___"+target+"_gp").selectAll("path")
						.attr("stroke", connectionColor)
						.attr("fill", connectionColor);
					
					$tooltip.css("z-index", -1).velocity({"opacity": 0});
					$("svg path").css("opacity", 1);
				});
					
			function positionTooltip(mouse) {
				var tooltip = {
					width: $('#connection_tooltip').width(),
					height: $('#connection_tooltip').height(),
				}, 
				scene = {
					margin: {
						x: 10,
						y: 10
					},
					padding: {
						x: 10,
						y: 10
					},
					x: function() { return this.margin.x + this.padding.x },
					y: function() { return this.margin.y + this.padding.y },
					width: function() { 
						return width - (this.margin.x * 2) - (this.padding.x * 2);
					},
					height: function() { 
						return height - (this.margin.y * 2) - (this.padding.y * 2);
					}
				};
				//Distance of element from the right edge of viewport
				if (scene.width() - (mouse.x + tooltip.width) < 20) { //If tooltip exceeds the X coordinate of viewport
					mouse.x = mouse.x - tooltip.width - 20;
				}
				//Distance of element from the bottom of viewport
				if (scene.height() - (mouse.y + tooltip.height) < 20) { //If tooltip exceeds the Y coordinate of viewport
					mouse.y = mouse.y - tooltip.height - 20;
				}
				return {
					top: mouse.y + 15,
					left: mouse.x
				};
			}
			
			var sourceLinePoints = [], targetLinePoints = [], isDestinationReached = false, 
                targetPointX, targetPointY = Math.abs(svgPosY - $targetParent.position().top) + targetPositionTop + getYpointToConnectToAttribute($target, targetConnectionSide),//get non used target point
                sourcePointX, sourcePointY = Math.abs(svgPosY - $sourceParent.position().top) + sourcePositionTop + getYpointToConnectToAttribute($source, sourceConnectionSide),//get non used source point
                currentPointX, currentPointY, elementViewPortFlag,
                currentSourcePointX, currentSourcePointY, currentTargetPointX, currentTargetPointY, lanePixelOffset, tmpTargetPointY = targetPointY, tmpSourcePointY = sourcePointY;
			
			//re-calcuating source node' y point based on visibilty in terms of scrollable area
			elementViewPortFlag = isElementInViewPort($source);
			if(elementViewPortFlag == "bottom") {
				sourcePointY = Math.abs(svgPosY - $sourceParent.position().top) + $sourceParent.height() - 5;
			} else if(elementViewPortFlag == "top") {
				sourcePointY = Math.abs(svgPosY - $sourceParent.position().top) + attributeHeight - 5;
			}
			
			//re-calcuating target node' y point based on visibilty in terms of scrollable area
			elementViewPortFlag = isElementInViewPort($target);
			if(elementViewPortFlag == "bottom") {
				if(direction.indexOf("n") != -1) {
					targetPointY = $targetParent.height() - 5;
				} else  {
					targetPointY = svgHeight - laneWidth;
				}

			} else if(elementViewPortFlag == "top") {
				targetPointY = targetParentPosition.top + attributeHeight - 5;
			}
			
			function getPointMX() {
				var sourceParentPositionLeft = Math.floor($sourceParent.position().left),
					targetParentPositionLeft = Math.floor($targetParent.position().left);
				if(((sourceParentPositionLeft + 5) >= targetParentPositionLeft) && ((sourceParentPositionLeft - 5) <= targetParentPositionLeft)) {
					return 0;
				} else {
					return svgWidth;
				}
			}
			
			if(direction.indexOf("v") != -1) {
				var pointX = getPointMX();
				sourceLinePoints.push({x: pointX, y: sourcePointY});
				targetLinePoints.push({x: pointX, y: targetPointY});
				var sourceLanePixelOffset = getXpointToMoveToVerticalRoad($sourceParent), 
					targetLanePixelOffset = getXpointToMoveToVerticalRoad($targetParent);
					
				sourceLinePoints.push({x: sourceLanePixelOffset, y: sourcePointY});
				targetLinePoints.unshift({x: sourceLanePixelOffset, y: targetPointY});
				
				sourceLinePoints.push({x: sourceLanePixelOffset, y: targetPointY});
			} else {
				//step: 0
				//Moving svg path to initial points on the source and target
				if(direction.indexOf("w") != -1) {
					sourceLinePoints.push({x: getPointMX(), y: sourcePointY});
					targetPointX = 0;
					sourcePointX = svgWidth;
					targetLinePoints.push({x: 2, y: targetPointY});
				} else {
					sourceLinePoints.push({x: 0, y: sourcePointY});
					targetPointX = svgWidth;
					sourcePointX = 0;
					targetLinePoints.push({x: getPointMX(), y: targetPointY});
				}


				currentSourcePointX = sourcePointX, currentSourcePointY = sourcePointY;
				currentTargetPointX = targetPointX, currentTargetPointY = targetPointY;
				//step: 1 //find nearest road, lane and pixel
				//step: 1 a) //source
				var sourceLanePixelOffset = getXpointToMoveToVerticalRoad($sourceParent), targetLanePixelOffset = getXpointToMoveToVerticalRoad($targetParent);
				if(direction.indexOf("w") != -1) {
					currentSourcePointX = svgWidth - sourceLanePixelOffset - pathStartEndPointOffset;//move left
				} else if(direction.indexOf("e") != -1) {
					currentSourcePointX = sourceLanePixelOffset + pathStartEndPointOffset;//move right
				}
				sourceLinePoints.push({x: currentSourcePointX, y: currentSourcePointY});

				//step: 1 b) //target
				if(direction.indexOf("w") != -1) {
					currentTargetPointX = targetLanePixelOffset + pathStartEndPointOffset;//move left
				} else if(direction.indexOf("e") != -1) {
					currentTargetPointX = svgWidth - targetLanePixelOffset - pathStartEndPointOffset;//move right
				}
				currentTargetPointY = targetPointY;

				//if can be joined by 3 hops
				if(Math.abs(currentSourcePointX - currentTargetPointX) <= 65) {
					currentTargetPointX = currentSourcePointX;	
				}

				targetLinePoints.unshift({x: currentTargetPointX, y: currentTargetPointY});

				//step: 2 //Move to common road, lane and pixel

				//step: 2 a) //target - target can easily identify the closest road than source identifying the common road which we can inform source to connect with
				currentTargetPointY = targetLinePoints[targetLinePoints.length - 1].y + Math.abs(tableHeight - $target.position().top) + getYpointToMoveToHorizontalRoad();
				currentTargetPointX = targetLinePoints[0].x;
				if(sourceLinePoints[sourceLinePoints.length-1].x == currentTargetPointX) {
					targetLinePoints.unshift({x: sourceLinePoints[sourceLinePoints.length-1].x, y: targetLinePoints[targetLinePoints.length-1].y});
				} else {
					targetLinePoints.unshift({x: currentTargetPointX, y: currentTargetPointY});
				}

				//step: 2 b) //source - source will use target' y coordinate and previous x coordinate of source to identify the common road
				if(sourceLinePoints[sourceLinePoints.length-1].x == currentTargetPointX) {
					sourceLinePoints.push({x: sourceLinePoints[sourceLinePoints.length-1].x, y: targetLinePoints[targetLinePoints.length-1].y});
				} else {
					sourceLinePoints.push({x: sourceLinePoints[sourceLinePoints.length-1].x, y: currentTargetPointY});
				}
			}
            var finalLinePoints = sourceLinePoints.concat(targetLinePoints);
            var path = svg.append('path')
                .attr("class", source+"___"+target)
				.attr("id", source+"___"+target)
                .attr("data-start", source)
                .attr("data-end", target)
                .attr("stroke", connectionColor)
				.attr("stroke-width", 2)
                .attr("fill", "none")
				.attr("pointer-events", "visibleStroke")
				.style("cursor", "pointer")
                .attr('d', lineFunction(finalLinePoints))
				.on("click", function() {
					_this.deleteConnection(this);
				}).on("mouseenter", function() {
					//alert(12);
				});
			
			//instead of storing points calculated for base or top using scrolltop visibility, actual points are stored so that can be used on scroll
			var tempFinalLinePoints = $.extend(true, [], finalLinePoints);
			tempFinalLinePoints[0].y = tempFinalLinePoints[1].y = tmpSourcePointY;
			tempFinalLinePoints[tempFinalLinePoints.length - 1].y = tempFinalLinePoints[tempFinalLinePoints.length - 2].y = tmpTargetPointY;
			$(path.node()).data("d", tempFinalLinePoints);
			
			var group = svg.append('g')
				.attr("id", source+"___"+target+"_gp");
			
			var pathNode = path.node(), pathLength = pathNode.getTotalLength();
			if(direction.indexOf("w") != -1) {
				group
					.append("path")
					.attr("fill", connectionColor)
					.attr('d', lineFunction([{x:10, y:0}, {x:10, y:15}, {x:0, y:7}, {x:10, y:0}]));
				
				group
					.attr("transform", function() {
						var p = pathNode.getPointAtLength(0)
						return "translate(" + [p.x, p.y] + ")";
					})
					.transition().duration(2000)
					.attrTween("transform", function() {
						return function (t) {
							var p = pathNode.getPointAtLength(pathLength*t);
							return "translate(" + [p.x-1, p.y-7] + ")";
						}
					});
				$(group.node()).data("translate", {x: tempFinalLinePoints[tempFinalLinePoints.length-1].x-1, y: tempFinalLinePoints[tempFinalLinePoints.length-1].y-7});
				
			} else if(direction.indexOf("e") != -1) {
				group
					.append("path")
					.attr("fill", connectionColor)
					.attr('d', lineFunction([{x:0, y:0}, {x:0, y:15}, {x:10, y:7}, {x:0, y:0}]));
				
				group
					.attr("transform", function() {
						var p = pathNode.getPointAtLength(0)
						return "translate(" + [p.x, p.y] + ")";
					})
					.transition().duration(2000)
					.attrTween("transform", function() {
						return function (t) {
							var p = pathNode.getPointAtLength(pathLength*t);
							return "translate(" + [p.x-9, p.y-7] + ")";
						}
					});
				$(group.node()).data("translate", {x: tempFinalLinePoints[tempFinalLinePoints.length-1].x-9, y: tempFinalLinePoints[tempFinalLinePoints.length-1].y-7});
			}
            
			/**
				Path animation
			*/
			var path = $("path", svg[0])[0];
            var length = path.getTotalLength();
            // Clear any previous transition
            path.style.transition = path.style.WebkitTransition = 'none';
            // Set up the starting positions
            path.style.strokeDasharray = length + ' ' + length;
            path.style.strokeDashoffset = length;
            // Trigger a layout so styles are calculated & the browser
            // picks up the starting position before animating
            path.getBoundingClientRect();
            // Define our transition
            path.style.transition = path.style.WebkitTransition = 'stroke-dashoffset 2s ease-in-out';
            // Go!
            path.style.strokeDashoffset = '0';
			
			setTimeout(function() {
				path.style.strokeDasharray = 0;
			}, 2000)

            /**
                Gap between tables is roads.
				50 pixel for any table to draw connection
				usedHorizontalLanePixels will have used pixel information in relative to container. 
				Lookup any horizontal path in this array to check if lane pixel is available for drawing .
			*/
			//assumes there won't be more than 19 connections to table. If goes more, then lines will overlap
			function getXpointToMoveToVerticalRoad($table) {
				var usedLanes = $table.data("usedLanes"), lanePixel;
				
				if(usedLanes && usedLanes.length) {
                    lanePixel = usedLanes[usedLanes.length - 1];
					if(xpointsOnVerticalLane[xpointsOnVerticalLane.indexOf(lanePixel) + 1]) {
						lanePixel = xpointsOnVerticalLane[xpointsOnVerticalLane.indexOf(lanePixel) + 1];
					} else {
						lanePixel = usedLanes[0];
					}
                } else {
                    lanePixel = xpointsOnVerticalLane[0];
					usedLanes = [];
                }
				usedLanes.push(lanePixel);
				$table.data("usedLanes", usedLanes);
                return lanePixel;
			}
			
            function getYpointToMoveToHorizontalRoad(targetActualPositionTop) {
				var getLanePixel = function() {
					var lanePixel, tmpLanePixel;
					lanePixel = tmpLanePixel = Math.floor(Math.random() * (49 - 15 + 1)) + 15;
					if(usedHorizontalLanePixels.indexOf(tmpLanePixel) != -1) {
						return getLanePixel();
					} else {
						lanePixel = tmpLanePixel+5;
						if(usedHorizontalLanePixels.indexOf(lanePixel) != -1 || usedHorizontalLanePixels.indexOf(lanePixel) != -1) {
							return getLanePixel();
						} else {
							usedHorizontalLanePixels.push(lanePixel);
							return lanePixel;
						}
					}
				};
				return getLanePixel();
            }
			
			function getYpointToConnectToAttribute($attribute, side) {
				/*
					TODO: Better logic where points are determined with offset to each other and update coordinates of other drawn points appropriately
				*/
				var side = side, $attribute = $attribute;
				var getPoint = function() {
					var point, points = ($attribute.data("usedYPoints"+side) || []);
					if(!points.length) {
						return attributeHeight/2;
					}
					point = Math.floor(Math.random() * (attributeHeight - 3 + 1)) + 3;
					if(points.indexOf(point) != -1) {
						return getPoint();
					} else {
						if(points.indexOf(point+1) != -1 || points.indexOf(point-1) != -1) {
							return getPoint();
						} else {
							points.push(point);
							$attribute.data("usedYPoints"+side, points);
							return point;
						}
					}
				};
				return getPoint();
			}
        };

		function isElementInViewPort($elem) {
			var $scrollableElement = $elem.parents(".attributeslist"),
				docViewTop = $scrollableElement.offset().top,
				docViewBottom = docViewTop + $scrollableElement.height(),
				elemTop = $elem.offset().top, //25 for title
				elemBottom = elemTop + ($elem.height()/2);

			if((elemBottom <= docViewBottom) && (elemTop >= docViewTop) || ($scrollableElement[0].scrollHeight == $scrollableElement[0].clientHeight)) {
				return true;
			} else {
				if(elemBottom >= docViewBottom) {
					return "bottom";
				} else {
					return "top";
				}
			}
		}
		
        renderTable = function(tableInfo) {
			var table = document.createElement("div"), tableTitleContainer, tableTitle, attributesContainer, tableAttr, baseHolder;
            table.className = "entity";
            table.id = tableInfo.identifier;
            table.style.position = "absolute";
            table.style.overflow = "hidden";
            table.style.width = tableWidth+"px";

            tableTitleContainer = document.createElement("div");
            tableTitleContainer.className = "titleContainer";
            
            tableTitle = document.createElement("div");
            tableTitle.innerText = tableInfo.name;
            tableTitle.className = "title";
            tableTitle.style.textAlign = "center";
            tableTitleContainer.appendChild(tableTitle);

            table.appendChild(tableTitleContainer);

            attributesContainer = document.createElement("div");
			attributesContainer.className = "attributeslist";
            attributesContainer.style.overflowX = "hidden";
            attributesContainer.style.overflowY = "auto";
            
            tableInfo.attributes.forEach(function(item) {
                tableAttr = document.createElement("div");
                tableAttr.className = "entity_attribute";
                tableAttr.id = item.identifier;
                tableAttr.style.width = "100%";
                tableAttr.style.textAlign = "center";
                tableAttr.innerText = item.name;
                attributesContainer.appendChild(tableAttr);
            });
			$(attributesContainer).scroll(function(e) {
				instance.adjustConnectionsOnScroll(e);
			});
            table.appendChild(attributesContainer);
			
			baseHolder = document.createElement("div");
			baseHolder.className = "baseHolder";
			baseHolder.style.height = "10px";
			baseHolder.style.width = "100%";
			table.appendChild(baseHolder);
            return table;
        };
		
		this.adjustConnectionsOnScroll = function(e) {
			var $scrolledElement = $(e.target), 
				scrollTop = $scrolledElement.scrollTop(), 
				$entity = $scrolledElement.parents(".entity"),
				calculatedTableHeight = $entity.height(),
				id = $entity[0].id, relativeSVGtop,
				paths = $("."+id+" > path"), sourcePaths, targetPaths, pathCods;
			
			if(!$("."+id).length) {
				return;
			}
			
			paths.each(function(idx, item) {
				var $this = $(this),
					pathCods = this.pathSegList,
					involvedSourceAttr = $("#"+$this.attr("data-start"), $scrolledElement),
					involvedTargetAttr = $("#"+$this.attr("data-end"), $scrolledElement),
					scrolledElementTablePosition = $entity.position(),
					group, 
					sourceViewFlag,
					targetViewFlag,
					sourceYpoint,
					targetYpoint;
				relativeSVGtop = Math.abs($entity.position().top - $("svg."+$this.attr("data-start")+"___"+$this.attr("data-end")).position().top);
				if(involvedSourceAttr.length) {
					sourceViewFlag = isElementInViewPort(involvedSourceAttr);
					if(sourceViewFlag === true) {
						sourceYpoint = $this.data("d")[0].y - scrollTop;
					} else if(sourceViewFlag == 'bottom') {
						sourceYpoint = relativeSVGtop + calculatedTableHeight - 5;
					} else if(sourceViewFlag == "top") {
						sourceYpoint = relativeSVGtop + attributeHeight - 5;
					}
					pathCods.getItem(0).y = pathCods.getItem(1).y = sourceYpoint;
				} else {
					group = $this.parent().find("g");
					targetViewFlag = isElementInViewPort(involvedTargetAttr);
					if(targetViewFlag === true) {
						targetYpoint = $this.data("d")[pathCods.numberOfItems-2].y - scrollTop;
						group[0].transform.baseVal.getItem(0).setTranslate(group.data("translate").x, group.data("translate").y - scrollTop);
					} else if(targetViewFlag == 'bottom') {
						targetYpoint = relativeSVGtop + calculatedTableHeight - 5;
						group[0].transform.baseVal.getItem(0).setTranslate(group.data("translate").x, targetYpoint - 7);
					} else if(targetViewFlag == "top") {
						targetYpoint = relativeSVGtop + attributeHeight - 5;
						group[0].transform.baseVal.getItem(0).setTranslate(group.data("translate").x, targetYpoint -7);
					}
					pathCods.getItem(pathCods.numberOfItems-2).y = pathCods.getItem(pathCods.numberOfItems-1).y = targetYpoint;
				}
			});
		};
		
		getPositionByAngle = function(angles, radius) {
            var positions = [], position, radiusX = (radius || {}).x, radiusY = (radius || {}).y;
            angles.forEach(function(eachOrbitAngles, indexOfOrbit) {
                position = [];
                eachOrbitAngles.forEach(function(eachAngle, idx) {
                    if(!radius || !radius.x) {
                        radiusX = (tableWidth + laneWidth/2)*(indexOfOrbit+1);
                    }
                    if(!radius || !radius.y) {
                        radiusY = (tableHeight + laneWidth/2)*(indexOfOrbit+1);
                    }
                    position.push({
                        x: centerXPoint + (radiusX * Math.cos(eachAngle * 3.14 / 180)),
                        y: centerYPoint + (radiusY * Math.sin(eachAngle * 3.14 / 180))
                    });
                });
                positions.push(position);
            });
            return positions;
        };

        var calculatePosition = function(rectsPositionMeta) {
			rectsPositionMeta.forEach(function(item, idx) {
				item.position = getTableOrbitLayout(item, rectsPositionMeta[idx-1]);
			});
			return rectsPositionMeta;
		},
		getTableOrbitLayout = function(thisOrbitMeta, previousOrbitMeta) {
			previousOrbitMeta = previousOrbitMeta || {};
			var centerYPoint = (availableHeight/2),
				centerXPoint = (availableWidth/2),
				laneWidth = 100, top, left, width, height, tablePosition = [], 
				previousPositionMeta = (previousOrbitMeta.position || {}),
				maxTableInThisRect = thisOrbitMeta.maxNoOfTables,
				orbitIndex = thisOrbitMeta.orbitCnt, 
				totalTablesCount = _data.length,
				fillOrder = ["topleft", "bottomright", "topright", "bottomleft", "topcenter", "bottomcenter", "leftcenter", "rightcenter"];
			if(orbitIndex%2 !== 0) {
				fillOrder = ["leftcenter", "rightcenter", "topcenter", "bottomcenter", "topleft", "bottomright", "topright", "bottomleft"];
			}
			if(maxTableInThisRect === 1) {
				top = (centerYPoint - tableHeight/2);
				left = (centerXPoint - tableWidth/2);
				height = tableHeight;
				width = tableWidth;
				tablePosition.push({
					top: top,
					left: left
				});
			} else {
				if(orbitIndex === 1) {
					width = (laneWidth) + (2*tableWidth);
					height = tableHeight;
					top = (centerYPoint - tableHeight/2);
					left = (centerXPoint - ((laneWidth) + (2*tableWidth))/2);
					//assuming max table here will be 2 only
					tablePosition.push({
						top: top,
						left: left
					});
					tablePosition.push({
						top: top,
						left: left + width - tableWidth //box right end in case of 2 table box
					});
				} else if(orbitIndex == 2 && (totalTablesCount == 4 || totalTablesCount == 3)) {//total table count
					if(totalTablesCount === 3) {
						width = previousPositionMeta.width + (2*laneWidth) + (2*tableWidth);
						height = previousPositionMeta.height;
						top = previousPositionMeta.top;
						left = (centerXPoint - (width/2));
						tablePosition.push({
							top: top,
							left: left
						});
						tablePosition.push({
							top: top,
							left: left + width - tableWidth 
						});
					} else {
						//adjust previous orbit tables
						previousPositionMeta.top = centerYPoint - ((2*tableHeight + laneWidth)/2);
						previousPositionMeta.tablePosition[0].top = previousPositionMeta.top;
						previousPositionMeta.tablePosition[1].top = previousPositionMeta.top;
						width = previousPositionMeta.width;
						height = previousPositionMeta.height;
						top = previousPositionMeta.top + tableHeight + laneWidth;
						left = previousPositionMeta.left;
						tablePosition.push({
							top: top,
							left: left
						});
						tablePosition.push({
							top: top,
							left: left + width - tableWidth 
						});
					}
				} else {
					width = previousPositionMeta.width + ((2*laneWidth) + (2*tableWidth));
					height = previousPositionMeta.height + (2*laneWidth) + (2*tableHeight);
					top = centerYPoint - (height/2);
					left = centerXPoint - (width/2);
					for(var tableCnt = 1; tableCnt <= maxTableInThisRect; tableCnt++) {
						if(fillOrder[tableCnt-1] == "topleft") {
							tablePosition.push({
								top: top,
								left: left
							});	
						} else if(fillOrder[tableCnt-1] == "bottomright") {
							tablePosition.push({
								top: top + height - tableHeight,
								left: left + width - tableWidth
							});	
						} else if(fillOrder[tableCnt-1] == "topright") {
							tablePosition.push({
								top: top,
								left: left + width - tableWidth
							});	
						} else if(fillOrder[tableCnt-1] == "bottomleft") {
							tablePosition.push({
								top: top + height - tableHeight,
								left: left
							});	
						} else if(fillOrder[tableCnt-1] == "bottomcenter") {
							tablePosition.push({
								top: top + (height - tableHeight),
								left: left + ((width/2) - (tableWidth/2))
							});	
						} else if(fillOrder[tableCnt-1] == "leftcenter") {
							tablePosition.push({
								top: top + ((height/2) - (tableHeight/2)),
								left: left
							});	
						} else if(fillOrder[tableCnt-1] == "rightcenter") {
							tablePosition.push({
								top: top + ((height/2) - (tableHeight/2)),
								left: left + (width - tableWidth)
							});	
						} else if(fillOrder[tableCnt-1] == "topcenter") {
							tablePosition.push({
								top: top,
								left: left + ((width/2) - (tableWidth/2))
							});	
						}
					}
				}
			}
			return {
				width: width,
				height: height,
				top: top,
				left: left,
				tablePosition: tablePosition
			};
		};

    	this.calculateLayout = function(cnt) {
			var numberOfOrbitalRects = 1, 
				rectsPositionMeta = [],
				orbitCounter = 0, previousOrbitTablesCnt = 0, numberOfTablesInThisRect = 0;
			if(cnt % 2 !== 0) {
				orbitCounter = 1;
				cnt -= 1;
				rectsPositionMeta.push({noOfTables: 1, maxNoOfTables: 1, orbitCnt: 1});
			} else {
				orbitCounter = 0;
			}
			while(cnt > 0) {
				if(orbitCounter == 0) {
					cnt -= 2;
					numberOfTablesInThisRect = 2;
					previousOrbitTablesCnt += 2;
				} else {
					cnt -= (previousOrbitTablesCnt + 4);
					previousOrbitTablesCnt += 4;
					numberOfTablesInThisRect = previousOrbitTablesCnt - cnt;
				}
				numberOfOrbitalRects = ++orbitCounter;
				rectsPositionMeta.push({noOfTables: numberOfTablesInThisRect, maxNoOfTables: previousOrbitTablesCnt, orbitCnt: numberOfOrbitalRects});
			}
			return rectsPositionMeta = calculatePosition(rectsPositionMeta);
		};

        this.setData = function(data) {
            _data = data;
            layoutInfo = this.calculateLayout(_data.length);
            return this;
        };

        setTablePosition = function(table) {
            tablePositions[table.id] = {x: table.style.x, y: table.style.y};
        };

        this.renderTables = function() {
            var _this = this, table, flatten, positions, dataArray, promises = [], deferred;
            flatten = function(arr) {
                var flatArr = [];
                arr.forEach(function(item, idx) {
                    item.position.tablePosition.forEach(function(eachItem) {
						eachItem.parent = arr[idx];
                        flatArr.push(eachItem);
                    });
                });
                return flatArr;
            };
            
            positions = flatten(layoutInfo);
            dataArray = _data;
            
            dataArray.forEach(function(eachTable, idx) { 
            	deferred = $.Deferred();
                table = renderTable(eachTable);
				table.style.top = centerYPoint+"px";
				table.style.left = centerXPoint+"px";
				table.style.width = tableWidth+"px";
				table.style.maxHeight = tableHeight + 10;
				_el.appendChild(table);
				$(".attributeslist", table).css("maxHeight", tableHeight - attributeHeight);
                $(table).attr("data-orbitindex", positions[idx].parent.orbitCnt);
				(function(eachTable, index, deferred) {
					setTimeout(function() {
						$(eachTable).velocity({
							left: positions[index].left,
							top: positions[index].top
						}, {
							duration: 500,
							easing: "swing",
							//queue: "",
							loop: false,
							delay: true,
							complete: function() {
								setTablePosition(eachTable);
								deferred.resolve();
							}
						});
					}, index*100);
					promises.push(deferred.promise());
				}(table, idx, deferred));
            });
			$(".entity_attribute", _el).click(function(e) {
				_this.addConnection(e);
			});
            /*$(".entity", _el).draggable({
                handle: ".title", 
                cursor: "move",
                drag: function(event, ui) {
                    var $svg = $("svg."+ui.helper[0].id);
                    if(ui.position.left > ui.originalPosition.left) {
                        $svg.attr("width", parseInt($svg.attr("width")) + ui.position.left - ui.originalPosition.left);
                    } else if(ui.position.left < ui.originalPosition.left) {
                        $svg.attr("width", parseInt($svg.attr("width")) - ui.position.left - ui.originalPosition.left);
                    }
                    if(ui.position.top > ui.originalPosition.top) {
                        $svg.attr("height", parseInt($svg.attr("height")) + ui.position.top - ui.originalPosition.top);
                    } else if(ui.position.top < ui.originalPosition.top) {
                        $svg.attr("height", parseInt($svg.attr("height")) - ui.position.top - ui.originalPosition.top);
                    }
                },
                stop: function(event, ui) {
                    
                }
            });*/
            return promises;
        };

        this.getConnections = function() {

        }

        this.renderConnections = function() {
            //array of {pair of identifier}
            var connections = this.getConnections();
            connections.forEach(function(eachConnection) {
                drawConnection(eachConnection[0], eachConnection[1]);
            });
            return this;
        };

        return this;
    }
    window.Diagram = Diagram;
}());