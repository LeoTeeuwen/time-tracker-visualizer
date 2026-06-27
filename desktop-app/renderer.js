const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')
const backButton = document.getElementById('dateBackBtn')
const forwardButton = document.getElementById('dateForwardBtn')
const currentDayText = document.getElementById('currentDayText')

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

// Renderer side to call something when app is closing!
window.addEventListener('beforeunload', (event) => {
  // Notify the main process via IPC to start saving data immediately
  // window.electronAPI.sendShutdownSignal(); 
  // console.log("unloaded!");
  // window.electronAPI.exampleFunction();
});


async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();

  let cleanedOutput = ""

  for (let entry of data.data) {
    let localDateTime = new Date(entry.event_time).toLocaleString();
    console.log(entry);
    if (entry.state == "active") {
      cleanedOutput = cleanedOutput + `Opened ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
    } 
    // else if (entry.state == "idle") {
    //   cleanedOutput = cleanedOutput + `Went idle on ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
    // } 
    else if (entry.state == "shutting_down") {
      cleanedOutput = cleanedOutput + `Closed ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
    } 
  }
  
  databaseText.innerText = cleanedOutput;
  
  currentDayText.innerText = await window.electronAPI.grabCurrentDate();
};


loadContent();