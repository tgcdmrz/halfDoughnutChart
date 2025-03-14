/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import * as d3 from "d3";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import ITooltipService = powerbi.extensibility.ITooltipService;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import ISelectionId = powerbi.visuals.ISelectionId;
import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import Fill = powerbi.Fill;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewValueColumns = powerbi.DataViewValueColumns;

import { VisualFormattingSettingsModel } from "./settings";

interface DataPoint {
    category: string;
    value: number;
    color: string; 
    percentage: number;
    selectionId: ISelectionId;
    tooltipItems?: VisualTooltipDataItem[];
    identity?: string;
    selected?: boolean;
    index: number;
}

interface VisualViewModel {
    dataPoints: DataPoint[];
    total: number;
    categorical?: DataViewCategorical;
    valuesColumn?: DataViewValueColumns;
}

export class Visual implements IVisual {
    private svg: d3.Selection<SVGElement, any, any, any>;
    private container: d3.Selection<SVGElement, any, any, any>;
    private host: IVisualHost;
    private colorPalette: IColorPalette;
    private tooltipService: ITooltipService;
    private visualViewModel: VisualViewModel;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private lastUpdate: number = 0;
    private currentDataView: DataView;

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.host = options.host;
        this.colorPalette = options.host.colorPalette;
        this.tooltipService = options.host.tooltipService;
        this.selectionManager = options.host.createSelectionManager();

        // Create SVG element
        this.svg = d3.select(options.element)
            .append('svg')
            .classed('halfDoughnut', true);

        // Create container for the visualization
        this.container = this.svg.append('g')
            .classed('container', true);
            
        // Initialize empty view model
        this.visualViewModel = {
            dataPoints: [],
            total: 0
        };
    }

    private getViewModel(dataView: DataView): VisualViewModel {
        // Return empty view model if no data
        if (!dataView || !dataView.categorical || !dataView.categorical.categories || !dataView.categorical.categories[0] || !dataView.categorical.values) {
            return {
                dataPoints: [],
                total: 0
            };
        }

        const categorical = dataView.categorical;
        const categories = categorical.categories[0];
        const values = categorical.values[0];
        
        // Calculate total
        let total = 0;
        for (let i = 0; i < values.values.length; i++) {
            total += values.values[i] as number;
        }
        
        // Get category colors from objects
        const categoryColors = this.getCategoryColors(dataView, categories);
        
        // Update category color settings for formatting panel
        this.updateCategoryColorSettings(categories);
        
        // Create data points
        const dataPoints: DataPoint[] = [];
        
        for (let i = 0; i < categories.values.length; i++) {
            const category = categories.values[i].toString();
            const value = values.values[i] as number;
            
            // Create selection ID for the category
            const selectionId = this.host.createSelectionIdBuilder()
                .withCategory(categories, i)
                .createSelectionId();
            
            // Determine color based on settings
            let color = this.colorPalette.getColor(category).value;
            
            // Check if custom colors should be used
            const fillType = this.formattingSettings?.categoryColorsCard.fillType.value.value;
            if (fillType === 'custom') {
                // Use default color if specified
                const defaultColor = this.formattingSettings?.categoryColorsCard.defaultColor.value.value;
                if (defaultColor) {
                    color = defaultColor;
                }
            }
            else if (fillType === 'perCategory') {
                // Check if we have a specific color setting for this category
                const categoryColorSetting = this.formattingSettings.categoryColorSettings.find(
                    setting => setting.category === category
                );
                
                if (categoryColorSetting) {
                    color = categoryColorSetting.color;
                }
                // Or check if we have a color from data view objects
                else if (categoryColors[category]) {
                    color = categoryColors[category];
                }
            }
            
            // Create data point
            dataPoints.push({
                category,
                value,
                color,
                percentage: (value / total) * 100,
                selectionId,
                identity: selectionId.getKey(),
                index: i,
                tooltipItems: [
                    {
                        displayName: "Category",
                        value: category
                    },
                    {
                        displayName: "Value",
                        value: value.toString()
                    },
                    {
                        displayName: "Percentage",
                        value: `${(value / total * 100).toFixed(1)}%`
                    }
                ]
            });
        }
        
        return {
            dataPoints,
            total,
            categorical,
            valuesColumn: categorical.values
        };
    }

    public update(options: VisualUpdateOptions) {
        if (!options || !options.dataViews || !options.dataViews[0]) return;

        const dataView = options.dataViews[0];
        this.currentDataView = dataView;
        const viewport = options.viewport;
        
        // Updating timestamp
        this.lastUpdate = Date.now();
        
        // Save current colors to check for changes
        const currentColors = this.visualViewModel?.dataPoints?.map(dp => ({
            category: dp.category,
            color: dp.color
        })) || [];
        
        // Update formatting settings
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            dataView
        );
        
        // Process the data
        this.visualViewModel = this.getViewModel(dataView);

        // Update the viewport
        this.svg
            .attr('width', viewport.width)
            .attr('height', viewport.height);

        // Check if colors have changed
        let colorsChanged = false;
        if (currentColors.length > 0 && this.visualViewModel && this.visualViewModel.dataPoints) {
            for (const dp of this.visualViewModel.dataPoints) {
                const prevColorObj = currentColors.find(c => c.category === dp.category);
                if (prevColorObj && prevColorObj.color !== dp.color) {
                    colorsChanged = true;
                    break;
                }
            }
        }
        
        // Force update category colors from objects
        this.updateCategoryColorsFromObjects(dataView);
        
        // Draw the chart
        this.drawChart(viewport.width, viewport.height);
    }

    private drawChart(width: number, height: number) {
        // Clear the container first
        this.container.selectAll('*').remove();

        // Skip drawing if no data
        if (!this.visualViewModel || this.visualViewModel.dataPoints.length === 0) {
            return;
        }

        const radius = Math.min(width, height) / 2;
        const innerRadius = radius * (this.formattingSettings.chartOptionsCard.innerRadius.value / 100);

        // Center the container
        this.container.attr('transform', `translate(${width / 2},${height / 2})`);

        // Create arc generator
        const arc = d3.arc<any>()
            .innerRadius(innerRadius)
            .outerRadius(radius)
            .startAngle((d: any) => (d.startAngle - Math.PI / 2))
            .endAngle((d: any) => (d.endAngle - Math.PI / 2));

        // Create pie generator
        const pie = d3.pie<DataPoint>()
            .value(d => d.value)
            .sortValues(null) // Disable sorting to keep the order stable
            .startAngle(this.formattingSettings.chartOptionsCard.startAngle.value * Math.PI / 180)
            .endAngle(this.formattingSettings.chartOptionsCard.endAngle.value * Math.PI / 180);

        // Create the pie data
        const pieData = pie(this.visualViewModel.dataPoints);

        // Bind data
        const arcs = this.container.selectAll('.arc')
            .data(pieData, (d: any) => d.data.category); // Use category as key for stable updates

        // Remove old elements
        arcs.exit().remove();

        // Add new elements
        const arcsEnter = arcs.enter()
            .append('g')
            .classed('arc', true);

        // Update + Enter
        const arcsMerge = arcs.merge(arcsEnter);

        // Draw paths with tooltips
        const paths = arcsMerge.selectAll('path')
            .data(d => [d])
            .join('path')
            .attr('d', arc)
            .style('fill', (d: any) => d.data.color)
            .style('stroke', 'white')
            .style('stroke-width', '1px')
            .style('transition', 'fill 0.3s'); // Add transition for smooth color changes

        // Add tooltip behavior
        paths
            .on('mouseover', (event, d: any) => {
                const mouseEvent: MouseEvent = event;
                this.tooltipService.show({
                    dataItems: d.data.tooltipItems,
                    identities: [d.data.selectionId],
                    coordinates: [mouseEvent.clientX, mouseEvent.clientY],
                    isTouchEvent: false
                });
            })
            .on('mousemove', (event, d: any) => {
                const mouseEvent: MouseEvent = event;
                this.tooltipService.move({
                    dataItems: d.data.tooltipItems,
                    identities: [d.data.selectionId],
                    coordinates: [mouseEvent.clientX, mouseEvent.clientY],
                    isTouchEvent: false
                });
            })
            .on('mouseout', () => {
                this.tooltipService.hide({
                    immediately: true,
                    isTouchEvent: false
                });
            })
            .on('click', (event, d: any) => {
                const mouseEvent: MouseEvent = event;
                this.selectionManager.select(d.data.selectionId).then((ids) => {
                    paths.style('opacity', 0.5);
                    d3.select(event.currentTarget).style('opacity', 1);
                });
                event.stopPropagation();
            });

        // Click outside to clear selection
        this.svg.on('click', () => {
            this.selectionManager.clear();
            paths.style('opacity', 1);
        });

        // Add labels if enabled
        if (this.formattingSettings.chartOptionsCard.showLabels.value) {
            arcsMerge.selectAll('text')
                .data(d => [d])
                .join('text')
                .attr('transform', (d: any) => {
                    const pos = arc.centroid(d);
                    return `translate(${pos[0]},${pos[1]})`;
                })
                .style('text-anchor', 'middle')
                .style('fill', this.formattingSettings.labelsCard.color.value.value)
                .style('font-size', `${this.formattingSettings.labelsCard.fontSize.value}px`)
                .text((d: any) => {
                    const percentageText = this.formattingSettings.labelsCard.showPercentage.value ? `${Math.round(d.data.percentage)}%` : '';
                    const measureText = Math.round(d.data.value);
                    return `${percentageText} ${measureText}`;
                });
        }
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumerationObject {
        if (!options || !this.formattingSettings || !this.visualViewModel) {
            return { instances: [] };
        }
        
        const objectName = options.objectName;
        const objectEnumeration: VisualObjectInstance[] = [];
        
        switch (objectName) {            
            case 'chartOptions': {
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        startAngle: this.formattingSettings.chartOptionsCard.startAngle.value,
                        endAngle: this.formattingSettings.chartOptionsCard.endAngle.value,
                        innerRadius: this.formattingSettings.chartOptionsCard.innerRadius.value,
                        showLabels: this.formattingSettings.chartOptionsCard.showLabels.value
                    },
                    selector: null
                });
                break;
            }
            
            case 'labels': {
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        fontSize: this.formattingSettings.labelsCard.fontSize.value,
                        color: this.formattingSettings.labelsCard.color.value,
                        showPercentage: this.formattingSettings.labelsCard.showPercentage.value
                    },
                    selector: null
                });
                break;
            }
            
            case 'categoryColors': {
                objectEnumeration.push({
                    objectName: objectName,
                    properties: {
                        fillType: this.formattingSettings.categoryColorsCard.fillType.value,
                        defaultColor: this.formattingSettings.categoryColorsCard.defaultColor.value
                    },
                    selector: null
                });
                break;
            }
            
            case 'categoryColor': {
                // Only show category colors if "perCategory" mode is selected
                if (this.formattingSettings.categoryColorsCard.fillType.value.value === 'perCategory') {
                    // Add color selector for each category with display name
                    for (const dataPoint of this.visualViewModel.dataPoints) {
                        objectEnumeration.push({
                            displayName: dataPoint.category,
                            objectName: objectName,
                            properties: {
                                fill: {
                                    solid: {
                                        color: dataPoint.color
                                    }
                                }
                            },
                            selector: dataPoint.selectionId.getSelector()
                        });
                    }
                }
                // Otherwise just store the state but don't provide instances
                else if (this.visualViewModel && this.visualViewModel.dataPoints) {
                    // Skip adding instances but maintain the state in our settings
                }
                break;
            }
        }
        
        return {
            instances: objectEnumeration
        };
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        // Get the base formatting model
        const formattingModel = this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
        
        // If we're using per-category colors and have data points
        if (this.formattingSettings?.categoryColorsCard?.fillType?.value?.value === 'perCategory' && 
            this.visualViewModel && this.visualViewModel.dataPoints && this.visualViewModel.dataPoints.length > 0) {
            
            // Create a category color card for the formatting panel
            const categoryColorCard = {
                uid: "categoryColorCard",
                displayName: "Individual Colors",
                description: "Color for each category",
                groups: []
            } as any;
            
            // Add a color picker for each category
            this.visualViewModel.dataPoints.forEach((dataPoint) => {
                // Create a group for each category
                const group = {
                    uid: `categoryColor_${dataPoint.identity}`,
                    displayName: dataPoint.category,
                    slices: [{
                        uid: `categoryColorFill_${dataPoint.identity}`,
                        displayName: "Fill",
                        control: {
                            type: "ColorPicker",
                            properties: {
                                descriptor: {
                                    objectName: "categoryColor",
                                    propertyName: "fill",
                                    selector: dataPoint.selectionId.getSelector(),
                                    value: {
                                        solid: {
                                            color: dataPoint.color
                                        }
                                    }
                                },
                                instancesPropertyDescriptor: {
                                    objectName: "categoryColor",
                                    propertyName: "fill"
                                }
                            }
                        }
                    }]
                } as any;
                
                // Add the group to the card
                categoryColorCard.groups.push(group);
            });
            
            // Add the category color card to the formatting model
            formattingModel.cards.push(categoryColorCard);
        }
        
        return formattingModel;
    }

    /**
     * Update category color settings based on the current data
     */
    private updateCategoryColorSettings(categories: powerbi.DataViewCategoryColumn): void {
        if (!this.formattingSettings) return;
        
        // Get existing settings for reference (to preserve colors)
        const existingSettings = this.formattingSettings.categoryColorSettings.reduce((map, setting) => {
            map[setting.category] = setting.color;
            return map;
        }, {} as { [key: string]: string });
        
        // Clear existing settings
        this.formattingSettings.categoryColorSettings = [];
        
        // Create settings for each category
        for (let i = 0; i < categories.values.length; i++) {
            const category = categories.values[i].toString();
            const selectionId = this.host.createSelectionIdBuilder()
                .withCategory(categories, i)
                .createSelectionId();
                
            // Use existing color if available, otherwise use palette
            let color: string;
            if (existingSettings[category]) {
                color = existingSettings[category];
            } else {
                color = this.colorPalette.getColor(category).value;
            }
            
            // Add to settings
            this.formattingSettings.categoryColorSettings.push({
                category,
                color,
                selectionId
            });
        }
    }

    /**
     * Get category-specific colors from the DataView objects
     */
    private getCategoryColors(dataView: DataView, categories: powerbi.DataViewCategoryColumn): { [key: string]: string } {
        const categoryColors: { [key: string]: string } = {};
        
        if (!dataView || !dataView.categorical || !dataView.categorical.categories || !dataView.categorical.categories[0]) {
            return categoryColors;
        }
        
        // Try to extract colors from category objects
        const objects = dataView.categorical.categories[0].objects;
        if (objects) {
            for (let i = 0; i < categories.values.length; i++) {
                const category = categories.values[i].toString();
                
                // Check if this category has objects
                if (objects[i] && objects[i].categoryColor && objects[i].categoryColor.fill) {
                    const fill = objects[i].categoryColor.fill as Fill;
                    if (fill && fill.solid && fill.solid.color) {
                        categoryColors[category] = fill.solid.color;
                    }
                }
            }
        }
        
        // Use existing settings as a fallback
        if (this.formattingSettings && this.formattingSettings.categoryColorSettings) {
            for (const setting of this.formattingSettings.categoryColorSettings) {
                if (setting.category && setting.color && !categoryColors[setting.category]) {
                    categoryColors[setting.category] = setting.color;
                }
            }
        }
        
        return categoryColors;
    }

    /**
     * Update category colors from the dataView objects if available
     */
    private updateCategoryColorsFromObjects(dataView: DataView): void {
        if (!dataView || !dataView.categorical || !dataView.categorical.categories || !dataView.categorical.categories[0]) {
            return;
        }
        
        const categories = dataView.categorical.categories[0];
        const objects = categories.objects;
        
        // Skip if we don't have objects
        if (!objects) return;
        
        let colorChanged = false;
        
        // Update colors in our settings
        for (let i = 0; i < categories.values.length; i++) {
            if (!objects[i] || !objects[i].categoryColor) continue;
            
            const category = categories.values[i].toString();
            const categoryObj = objects[i].categoryColor;
            
            if (categoryObj.fill && (categoryObj.fill as Fill).solid) {
                const fill = categoryObj.fill as Fill;
                const color = fill.solid.color;
                
                // Find and update the setting
                const setting = this.formattingSettings.categoryColorSettings.find(s => s.category === category);
                if (setting && setting.color !== color) {
                    setting.color = color;
                    colorChanged = true;
                }
                
                // Update the data point color if needed
                const dataPoint = this.visualViewModel.dataPoints.find(dp => dp.category === category);
                if (dataPoint && this.formattingSettings.categoryColorsCard.fillType.value.value === 'perCategory') {
                    if (dataPoint.color !== color) {
                        dataPoint.color = color;
                        colorChanged = true;
                    }
                }
            }
        }
        
        // If color has changed, redraw the chart
        if (colorChanged) {
            // Get the current viewport dimensions
            const width = this.svg.attr('width') as unknown as number;
            const height = this.svg.attr('height') as unknown as number;
            
            // Redraw the chart
            this.drawChart(width, height);
        }
    }
}