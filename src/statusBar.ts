import * as vscode from 'vscode';
import { store } from './store';
import fetch from 'node-fetch';
import { debounce } from 'lodash';

export class StatusBar {
    private _statusBarItem: vscode.StatusBarItem;
    private debouncedUpdateWordCount: () => {};

    constructor() {
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.debouncedUpdateWordCount = debounce(this.updateWordCount, 1000, {
            leading: true
        });
        this.addEventListeners();
    }

    private addEventListeners() {
        vscode.window.onDidChangeTextEditorSelection(this.debouncedUpdateWordCount, this);
        vscode.window.onDidChangeActiveTextEditor(this.debouncedUpdateWordCount, this);
    }

    public async fetchCommentCounts() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return ''; }

        const file = editor.document.uri.path.replace('/tmp/', '');
        const token = store.githubToken;

        const commentsRequests = await fetch(store.currentPullRequest.url + `/comments?access_token=${token}`)
        const comments = await commentsRequests.json();


        return comments.filter(comment => comment.path === file).length;
    }


    public async updateWordCount() {
        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }

        if(!store.currentPullRequest) { 
            return; 
        }
    
        const count = await this.fetchCommentCounts();
        this._statusBarItem.text =  `$(pencil) ${count} Pull Request's Comments`;
        if(count > 0) {
            this._statusBarItem.command = 'pullRequester.readComments';
        } else {
            this._statusBarItem.command = undefined;
        }
        this._statusBarItem.show();
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}