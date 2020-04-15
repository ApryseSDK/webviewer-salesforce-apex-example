var resourceURL = '/resource/'

window.CoreControls.forceBackendType('ems');
// office workers
window.CoreControls.setOfficeWorkerPath(resourceURL + 'office')
window.CoreControls.setOfficeAsmPath(resourceURL + 'officeAsm');
window.CoreControls.setOfficeResourcePath(resourceURL + 'officeResource');
// pdf workers
window.CoreControls.setPDFWorkerPath(resourceURL)
window.CoreControls.setPDFResourcePath(resourceURL + 'resource')
window.CoreControls.setPDFAsmPath(resourceURL + 'asm')
// $(document).on('viewerLoaded', function() {
//   var custom = JSON.parse(window.ControlUtils.getCustomData());
//   console.log('custom data', custom); // outputs 10
//   var resourceURL = custom.libUrl.replace('/lib', '/')
//
//   window.CoreControls.forceBackendType('ems');
//   // office workers
//   window.CoreControls.setOfficeWorkerPath(resourceURL + 'office')
//   // window.CoreControls.setOfficeAsmPath(resourceURL + 'officeAsm');
//   // window.CoreControls.setOfficeResourcePath(resourceURL + 'officeResource');
//   // pdf workers
//   window.CoreControls.setPDFWorkerPath(resourceURL)
//   window.CoreControls.setPDFResourcePath(resourceURL + 'resource')
//   window.CoreControls.setPDFAsmPath(resourceURL + 'asm')
// });

window.sampleL = 'demo:sisakov@pdftron.com:758c34bd0164a412c3d0733be2663fcfa35b809d67c9c77c02'; // enter your key here so that the samples will run

if (!window.sampleL) {
  window.sampleL = localStorage.getItem('wv-sample-license-key') || window.location.search.slice(5);
  if (!window.sampleL) {
    window.sampleL = window.prompt('No license key is specified.\nPlease enter your key here or add it to license-key.js inside the samples folder.', '');
    if (window.sampleL) {
      localStorage.setItem('wv-sample-license-key', window.sampleL);
    }
  }
}


window.addEventListener("message", receiveMessage, false);

const MIME_TYPE = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

function receiveMessage(event) {
  if (event.isTrusted && typeof event.data === 'object') {
    switch (event.data.type) {
      case 'OPEN_DOCUMENT':
        event.target.readerControl.loadDocument(event.data.file)
        break;
      case 'OPEN_DOCUMENT_BLOB':
        const { blobString, extension, name } = event.data.payload;
        const filename = name + '.' + extension;
        var blob = new Blob([_base64ToArrayBuffer(blobString)], {
          type: MIME_TYPE[extension]
        });
        event.target.readerControl.loadDocument(blob, { extension, filename, })
        break;
      case 'GENEREATE_THUMB':
        generateThumbnail(event.data.payload);
        break;
      default:
        break;
    }
  }
}

function _base64ToArrayBuffer(base64) {
  var binary_string =  window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array( len );
  for (var i = 0; i < len; i++)        {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateThumbnail(payload) {
  const { blobString, extension, name, id } = payload; 
  var options = { 
    l: window.sampleL/* license key here */,
    extension,
  };
  var blob = new Blob([_base64ToArrayBuffer(blobString)], {
    type: MIME_TYPE[extension]
  });
  var source = blob;
  var documentPromise = CoreControls.createDocument(source, options);
  documentPromise.then(function(doc) {
    doc.loadThumbnailAsync(0, function(canvas, index) {
        var dataURL = canvas.toDataURL();
        var result = {
          data: dataURL,
          id: id,
        }
        console.log(result)
        parent.postMessage({type: 'GENEREATED_THUMB_DATA', payload: result });
      }
    );
  })
}