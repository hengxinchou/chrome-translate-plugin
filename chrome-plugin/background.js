chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "thesaurusWord",
    title: "thesaurus",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "pronunciation",
    title: "pronunciation",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translateSelectionEN",
    title: "translateSelectionEN",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "translateSelectionZH",
    title: "translateSelectionZH",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "thesaurusWord") {
    const selectedText = info.selectionText;
    fetch('http://localhost:5000/thesaurus/' + encodeURIComponent(selectedText), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(response => response.json())
    .then(data => {
      showResponse(tab, data, selectedText);
    })
    .catch(error => console.error('Error:', error));
  }
  if (info.menuItemId === "pronunciation") {
    const selectedText = info.selectionText;
    fetch('http://localhost:5000/pronunciation/' + encodeURIComponent(selectedText), {
      method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
      showResponse(tab, data, selectedText);
   })
    .catch(error => console.error('Error:', error));
  }
  if (info.menuItemId === "translateSelectionEN" || info.menuItemId === "translateSelectionZH") {
    let from1 = "";
    let to = "";
    if (info.menuItemId === "translateSelectionEN" ) {
      from1 = 'en';
      to = 'zh';
    } else if (info.menuItemId === "translateSelectionZH" ) {
      from1 = 'zh';
      to = 'en';
    }
    const selectedText = info.selectionText;
    fetch('http://localhost:5000/translatesection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selectedText : selectedText , from: from1, to: to })
    })
    .then(response => response.json())
    .then(data => {
        showResponse(tab, data, selectedText);
    })
    .catch(error => console.error('Error:', error));
  }
});

function showResponse(tab, data, selectedText){
      if (tab.id == "-1" ) {
          // send message to popup html
          chrome.storage.local.set({ translatedText: data.result }, () => {
          chrome.action.openPopup();
          });
        }else if (tab != null) {
          const translatedText = data.result;

          // send message content script
          chrome.tabs.sendMessage(tab.id, { translatedText, selectedText });

        } else {
          // send message background script
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: displayTranslation,
            args: [data.result]
          });
        }
}

function displayTranslation(translatedText) {
  translatedText = translatedText.replace("\"", "").replace("\"", "");
  const div = document.createElement('div');
  div.innerHTML = translatedText;
  div.style.position = 'fixed';
  div.style.bottom = '10px';
  div.style.right = '10px';
  div.style.backgroundColor = 'white';
  div.style.border = '1px solid black';
  div.style.padding = '10px';
  div.style.zIndex = '9999';  
  document.body.insertBefore(div, document.body.firstChild);

  timeout = translatedText.length > 150 ?  10000 : 5000;
  setTimeout(() => div.remove(), timeout);
}

