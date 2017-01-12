import { StatusBarItem, window, workspace, OutputChannel, StatusBarAlignment } from 'vscode';

import { TestRunner } from './TestRunner';
import { constants } from './constants';

let instance: NodeTDD;

export class NodeTDD {
    private enabled = false;
    private outputShown = false;
    private extensionStatusBar: StatusBarItem;
    private buildStatusBar: StatusBarItem;
    private coverageStatusBar: StatusBarItem;
    private outputChannel: OutputChannel;
    private testRunner: TestRunner;

    static getInstance() {
        if (!instance) {
            instance = new NodeTDD();
        }

        return instance;
    }

    static getConfig() {
        return workspace.getConfiguration(constants.CONFIG_SECTION_KEY);
    }

    private constructor() {
        this.outputChannel = window.createOutputChannel(constants.OUTPUT_CHANNEL_NAME);
        this.testRunner = new TestRunner();

        this.extensionStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 3);
        this.buildStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 2);
        this.coverageStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 1);

        const activateOnStartup = NodeTDD.getConfig().get<boolean>('activateOnStartup');

        if (activateOnStartup) {
            this.activate();
        }
        else {
            this.deactivate();
        }

        this.extensionStatusBar.show();
    }

    activate() {
        this.enabled = true;
        this.showBuildStatusBar();
        Object.assign(this.extensionStatusBar, constants.ACTIVATE_EXTENSION);
        this.testRunner.watch();
        this.showCoverageStatusBar();
    }

    deactivate() {
        this.enabled = false;
        this.hideBuildStatusBar();
        this.hideCoverageStatusBar();
        Object.assign(this.extensionStatusBar, constants.DEACTIVATE_EXTENSION);
        this.testRunner.dispose();
    }

    setBuildStatusBar(obj: Partial<StatusBarItem>) {
        Object.assign(this.buildStatusBar, obj);
    }

    showBuildStatusBar() {
        this.buildStatusBar.show();
    }

    hideBuildStatusBar() {
        this.buildStatusBar.hide();
    }

    clearOutput() {
        this.outputChannel.clear();
    }

    hideOutput() {
        this.outputChannel.hide();
        this.outputShown = false;
    }

    toggleOutput() {
        if (this.outputShown) {
            this.outputChannel.hide();
        }
        else {
            this.outputChannel.show();
        }

        this.outputShown = !this.outputShown;
    }

    appendOutput(text: string) {
        this.outputChannel.append(text);
    }

    stopBuild() {
        this.testRunner.stop();
    }

    async showInfoDialog(code: number | null) {
        if (!NodeTDD.getConfig().get<boolean>('verbose')) {
            return;
        }

        let clicked;

        if (code === 0) {
            clicked = await window.showInformationMessage(
                constants.PASSING_DIALOG_MESSAGE, constants.SHOW_OUTPUT_DIALOG_MESSAGE).then();
        }
        else if (code === 1) {
            clicked = await window.showErrorMessage(
                constants.FAILING_DIALOG_MESSAGE, constants.SHOW_OUTPUT_DIALOG_MESSAGE).then();
        }
        else if (code === null) {
            window.showWarningMessage(constants.STOPPED_DIALOG_MESSAGE);
        }

        if (clicked && clicked === constants.SHOW_OUTPUT_DIALOG_MESSAGE) {
            this.outputChannel.show();
            this.outputShown = true;
        }
    }

    setCoverage(coverage: string | null) {
        if (coverage) {
            Object.assign(this.coverageStatusBar, constants.coverageReport(coverage));
        }
    }

    clearCoverage() {
        this.coverageStatusBar.text = '';
    }

    hideCoverageStatusBar() {
        this.coverageStatusBar.hide();
    }

    showCoverageStatusBar() {
        if (NodeTDD.getConfig().get<boolean>('showCoverage') && this.coverageStatusBar.text) {
            this.coverageStatusBar.show();
        }
    }

    dispose() {
        this.extensionStatusBar.dispose();
        this.buildStatusBar.dispose();
        this.coverageStatusBar.dispose();
        this.outputChannel.dispose();
        this.testRunner.dispose();
    }
}
