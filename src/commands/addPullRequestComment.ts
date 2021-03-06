import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { store } from '../store';
import * as diffParse from 'parse-diff';

export async function addPullRequestComment() {
    
    const editor = vscode.window.activeTextEditor;
        
    if (editor) {
        const commentBody = await vscode.window.showInputBox({prompt: 'Add your comment.'})
        if(!commentBody) { return;  }
        let line = editor.selection.active.line;
        const lineText = editor.document.lineAt(line).text;
        const fileName = editor.document.uri.path.replace('/tmp/', '');
        const files = diffParse(store.pullRequestDiff);
        const file = files[files.findIndex(f => f.to === fileName)];

        const lines: Array<any> = [];
        file.chunks.forEach(function({changes, content}) {
            lines.push(content)
            changes.forEach(change => {
                lines.push(change.content);
            });
        });

        const token = await store.githubToken;

        let lineNumber;
        for (let i = 0; i< lines.length; i++) {
            if(lines[i].includes(lineText)) {
                lineNumber =  i;
            }
        }

        const body = {
            commit_id: store.currentPullRequest.head.sha,
            path: fileName,
            position:lineNumber,
            body: commentBody
          };
        const response = await fetch(
            `${store.currentPullRequest.base.repo.url}/pulls/${store.currentPullRequest.number}/comments?access_token=${token}`
        , {method: 'post',
        body: JSON.stringify(body)})

        if(response.ok) {
            vscode.window.showInformationMessage('Comment has been created.');
        } else {
            vscode.window.showErrorMessage('Comment couldn\'t created.')
        }
    }
}