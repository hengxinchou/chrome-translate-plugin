chrome.runtime.onInstalled.addListener(() => {
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
});

// 快捷键
chrome.commands.onCommand.addListener(async (command) => {
  if( command === "thesaurus") {
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        chrome.scripting.executeScript({
          target: {tabId: tab.id},
          function: getSelectedText
        }, async (results) => {
          if (results && results[0]) {
            const selectedText = results[0].result;
            thesaurusText(selectedText, tab);
          }
        });
      } else {
        console.error('No active tabs found');
      }
    });
  }
  if (command === "translate-selection-en" || command === "translate-selection-zh") {
    let from1 = "";
    let to = "";
    if (command === "translate-selection-en" ) {
      from1 = 'en';
      to = 'zh';
    } else if (command === "translate-selection-zh" ) {
      from1 = 'zh';
      to = 'en';
    }
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        // console.log("zhx110: " + tab.id)
        try {
          // console.log("zhx-114: ");
          const results = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: getSelectedText,
            world: 'MAIN'
          });
          // console.log("zhx-114: ");
          if (results && results[0]) {
            // console.log("zhx-1110: " + results);
            const selectedText = results[0].result;
            // console.log("zhx-1111: " + results[0]);
            // console.log("zhx-1112: " + results[0].result);
            // console.log("zhx-115: " + selectedText);
            translateSelectedText(selectedText, tab, from1, to);
          }
        } catch (error) {
          console.error('Error executing script:', error);
        }
      } else {
        console.error('No active tabs found');
      }
    });
  }
});

function getSelectedText() {
  // console.log("zhx-218 ");
  // return window.getSelection().toString();
  const selection = window.getSelection();

  // console.log("zhx-219 ");
  // if (!selection || selection.rangeCount === 0) return '';
  // if (!selection || selection.rangeCount === 0) return '';
  
  // console.log("zhx-220 ");
  let selectedText = selection.toString();
  
  if (!selectedText) {
    // console.log("zhx-212 ");
    // 如果在 PDF 中没有选中文字，可能需要在嵌入的 iframe 中查找
    // const iframe = document.querySelector('embed[type="application/pdf"]') || document.querySelector('embed[type="application/x-google-chrome-pdf"]') || document.querySelector('iframe');
    // if (iframe) {
    //   const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    //   console.log("zhx-213 ");
    //   selectedText = iframeDocument.getSelection().toString();
    // }
    const embeds = document.querySelectorAll('embed[type="application/x-google-chrome-pdf"]');
    for (let embed of embeds) {
      const embedWindow = embed.contentWindow || embed;
      const embedSelection = embedWindow.getSelection();
      if (embedSelection) {
        const embedSelectedText = embedSelection.toString();
        if (embedSelectedText) {
          return embedSelectedText;
        }
      }
    }
  }

  return selectedText;
}

function thesaurusText(selectedText, tab){
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

function translateSelectedText(selectedText, tab, from1, to){
    console.log("zhx211: " + selectedText);
    console.log("zhx311: tabid, " + tab.id);
    fetch('http://localhost:5000/translateselection', {
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

// 鼠标右键的事件
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
    fetch('http://localhost:5000/translateselection', {
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
          console.log("zhx411: tabid, " + tab.id);
          chrome.storage.local.set({ translatedText: data.result }, () => {
          chrome.action.openPopup();
          });
        }else if (tab != null) {
          const translatedText = data.result;

          console.log("zhx412: tabid, " + tab.id);
          // send message content script
          chrome.tabs.sendMessage(tab.id, { translatedText, selectedText });

        } else {
          console.log("zhx413: tabid, " + tab.id);
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

