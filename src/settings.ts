/*
 *  Power BI Visualizations
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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import IEnumMember = powerbi.IEnumMember;

/**
 * Chart Options Formatting Card
 */
class ChartOptionsCardSettings extends FormattingSettingsCard {
    startAngle = new formattingSettings.NumUpDown({
        name: "startAngle",
        displayName: "Start Angle",
        value: 0,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 0 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 360 }
        }
    });

    endAngle = new formattingSettings.NumUpDown({
        name: "endAngle",
        displayName: "End Angle",
        value: 180,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 0 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 360 }
        }
    });

    innerRadius = new formattingSettings.NumUpDown({
        name: "innerRadius",
        displayName: "Inner Radius",
        value: 60,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 0 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 100 }
        }
    });

    showLabels = new formattingSettings.ToggleSwitch({
        name: "showLabels",
        displayName: "Show Labels",
        value: true
    });

    name: string = "chartOptions";
    displayName: string = "Chart Options";
    description: string = "General chart configuration options";
    slices: Array<FormattingSettingsSlice> = [this.startAngle, this.endAngle, this.innerRadius, this.showLabels];
}

/**
 * Labels Formatting Card
 */
class LabelsCardSettings extends FormattingSettingsCard {
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        description: "Font size for labels",
        value: 12,
        options: {
            minValue: { type: powerbi.visuals.ValidatorType.Min, value: 8 },
            maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 60 }
        }
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        description: "Font color for labels",
        value: { value: "#000000" }
    });

    showPercentage = new formattingSettings.ToggleSwitch({
        name: "showPercentage",
        displayName: "Show Percentage",
        description: "Display percentage values",
        value: true
    });

    name: string = "labels";
    displayName: string = "Labels";
    description: string = "Label settings";
    slices: Array<FormattingSettingsSlice> = [this.fontSize, this.color, this.showPercentage];
}

/**
 * Category Colors Formatting Card
 */
class CategoryColorsCardSettings extends FormattingSettingsCard {
    fillType = new formattingSettings.ItemDropdown({
        name: "fillType",
        displayName: "Fill Type",
        description: "Type of fill to use",
        value: { value: "default" } as IEnumMember,
        items: [
            { displayName: "Default", value: "default" } as IEnumMember,
            { displayName: "Custom", value: "custom" } as IEnumMember,
            { displayName: "Per Category", value: "perCategory" } as IEnumMember
        ]
    });

    defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayName: "Default Color",
        description: "Default color for all categories",
        value: { value: "#01B8AA" }
    });

    name: string = "categoryColors";
    displayName: string = "Category Colors";
    description: string = "Custom colors for categories";
    slices: Array<FormattingSettingsSlice> = [this.fillType, this.defaultColor];
}

/**
 * Individual Category Color Settings Card
 */
export class CategoryColorSettings {
    constructor(
        public category: string, 
        public color: string,
        public selectionId: powerbi.visuals.ISelectionId
    ) {}
}

/**
 * Visual Settings Model Class
 */
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    chartOptionsCard = new ChartOptionsCardSettings();
    labelsCard = new LabelsCardSettings();
    categoryColorsCard = new CategoryColorsCardSettings();
    categoryColorSettings: CategoryColorSettings[] = [];

    cards = [this.chartOptionsCard, this.labelsCard, this.categoryColorsCard];
}
