  document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get('translatedText', function (data) {

      timeout = data.translatedText.length > 150 ?  10000 : 5000;
      //Automatically close pop in n seconds
      setTimeout(() => { window.close(); }, timeout);
      document.getElementById('translatedText').innerHTML = data.translatedText || 'No translation available.';
    });
  });

