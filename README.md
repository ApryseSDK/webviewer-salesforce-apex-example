Each Salesforce record is represented as a sObject before it is inserted into Salesforce. Likewise, when persisted records are retrieved from Salesforce, they’re stored in a sObject variable.

Standard and custom object records in the Salesforce map to their sObject types in Apex. Here are some common sObject type names in Apex used for standard objects.

- Account
- Contact
- Lead
- ContentDocument
- ContentVersion


## Using Apex to access file records in Salesforce

To access files uploaded to Salesforce, we need to query <b>ContentVersion</b> table, which has a field called "VersionData" of type base64.

<b>Content Version:</b> Represents a specific version of a document in Salesforce CRM Content or Salesforce Files. In other words, this object stores document information similar to Attachment.

Here is sample Apex class
```Apex
public with sharing class ContentVersionController {
    @AuraEnabled(Cacheable=true)
    public static List<ContentVersion> getContentVersions() {
      return [SELECT Id, Title, FileExtension, IsMajorVersion, IsLatest, VersionData, IsAssetEnabled, LastModifiedDate
        FROM ContentVersion WHERE IsLatest = True];
    }
    @RemoteAction
    @AuraEnabled(Cacheable=true)
    public static Map<String,String> getFileBlobById(String Id) {
        ContentVersion cv = [SELECT Id, Title, FileExtension, IsMajorVersion, IsLatest, VersionData, IsAssetEnabled
          FROM ContentVersion
          WHERE Id = :Id];
        Map<String,String> response = new Map<String, String>();
        response.put('Title', cv.Title);
        response.put('FileExtension', cv.FileExtension);
        response.put('Content', EncodingUtil.base64Encode(cv.VersionData));
        return response;
    }
}
```


## Open Salesforce files in WebViewer

In order to open base64 file in WebViewer, first we need to convert [base64 to Blob](https://www.pdftron.com/documentation/web/guides/basics/open/base64/) object in JavaScript and pass it to [`readerControl.loadDocument`](https://www.pdftron.com/api/web/WebViewerInstance.html#loadDocument__anchor)

Here is an example Lightning Web Component app with WebViewer and showing an example on how to use Apex class and converting base64 to Blob.

```js
import { LightningElement, wire, track, api } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
/** ContentVersionController.getFileBlobById(id) Apex method */
import getFileBlobById from '@salesforce/apex/ContentVersionController.getFileBlobById';
export default class WvInstance extends LightningElement {
  ...
  initUI() {
    const viewer = new PDFTron.WebViewer({...}, viewerElement);
    viewerElement.addEventListener('ready', () => {
      this.iframeWindow = viewerElement.querySelector('iframe').contentWindow;
      this.openFile('CONTENT_VERSION_ID')
    })
  }
  ...
  openFile(Id) {
    getFileBlobById({ Id }).then(response => {
      const  { Title, FileExtension, Content } = response
      const filename = `${Title}.${FileExtension}`;
      var blob = new Blob([_base64ToArrayBuffer(Content)], {
        type: 'application/pdf'
      });
      const payload = {
        blob: blob,
        filename: filename,
        extension: FileExtension,
        documentId: this.contentVersionId,
      }
      this.iframeWindow.postMessage({type: 'OPEN_DOCUMENT_BLOB', payload }, '*')
    })
    .catch(this.showErrorMessage);
  }
  ...
}
```


You can also find the full source code for LWC app with WebViewer here on this [Github repository](https://github.com/PDFTron/webviewer-salesforce-apex-example)
