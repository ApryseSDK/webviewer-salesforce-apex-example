public with sharing class ContentVersionController {
    @AuraEnabled(Cacheable=true)
    public static List<ContentVersion> getContentVersions() {
      return [SELECT Id, Title, FileExtension, ContentDocumentId, IsMajorVersion, IsLatest, VersionData, IsAssetEnabled, LastModifiedDate
        FROM ContentVersion WHERE IsLatest = True];
    }

    @RemoteAction
    @AuraEnabled(Cacheable=true)
    public static Map<String,String> getFileBlobById(String Id) {
        ContentVersion cv = [SELECT Id, Title, FileExtension, ContentDocumentId, IsMajorVersion, IsLatest, VersionData, IsAssetEnabled FROM ContentVersion WHERE Id = :Id];
        // Returns string
        Map<String,String> response = new Map<String, String>();
        response.put('Title', cv.Title);
        response.put('FileExtension', cv.FileExtension);
        response.put('ContentDocumentId', cv.ContentDocumentId);
        response.put('Content', EncodingUtil.base64Encode(cv.VersionData));

        return response;
    }


    @AuraEnabled
    public static Id createContenVersion(String title, String base64Data, String filename, String fileType, String fileExtension, Id contentDocumentId){

      //base64Data  = EncodingUtil.urlDecode(base64Data, 'UTF-8')                                 ;
      ContentVersion cv = new ContentVersion();
      cv.ContentLocation = 'S'; // 'S' = a Salesforce File
      cv.ContentDocumentId = contentDocumentId;
      cv.VersionData = EncodingUtil.base64Decode(base64Data);
      cv.Title = title;
      cv.PathOnClient = filename;
      cv.ReasonForChange = 'Saved from WebViewer';

      // Utils.DatabaseInsert(cv);
      insert cv;
      System.debug('The contentDocumentId for ' + title + ' (' + filename +') ' +' is ' + cv.ContentDocumentId);

      return cv.Id;
  }
}
