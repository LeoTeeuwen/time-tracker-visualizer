const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')
const backButton = document.getElementById('dateBackBtn')
const forwardButton = document.getElementById('dateForwardBtn')

setButton.addEventListener('click', () => {
  window.electronAPI.pushToDatabase();
})

backButton.addEventListener('click', () => {
  window.electronAPI.backOneDay();
  loadContent();
})

forwardButton.addEventListener('click', () => {
  window.electronAPI.forwardOneDay();
  loadContent();
})

window.addEventListener('keydown', (event) => {
  if (event.key == "F12") {
    window.electronAPI.devToolsSwitch();
  }
})


async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();
  console.log(data.data)

  let cleanedOutput = ""

  for (let entry of data.data) {
    console.log(entry);
    let localDateTime = new Date(entry.event_time).toLocaleString();
    cleanedOutput = cleanedOutput + `device: ${entry.device}, datetime ${localDateTime} \n`;
  }

  databaseText.innerText = cleanedOutput;
};


loadContent();