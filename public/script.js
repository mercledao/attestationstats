let last7DaysData = [];
let last30DaysData = [];
let betweenDaysData = [];
let events = [];
const commName = {};
  const eventNames = {};
document.addEventListener("DOMContentLoaded", async () => {
    // Global variables to store fetched data
    
    // Function to fetch data from an API and store it in a global variable
    const fetchDataAndStoreInGlobalVariable = async (apiEndpoint, variable) => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        variable.push(data);
        console.log(`Data fetch completed for ${apiEndpoint}`);
      } catch (error) {
        console.error(`Error fetching data from ${apiEndpoint}:`, error);
      }
    };
  
    // Fetch data for the last 7 days and store it in the global variable
    await fetchDataAndStoreInGlobalVariable("/api/last-7-days", last7DaysData);
    // await fetchDataAndStoreInGlobalVariable("/api/last-30-days", last30DaysData);

    
    
    // console.log("Last 30 Days Data:", last30DaysData);
    getEventsData();
    console.log("All data fetch operations completed");
    
    // You can now access the data in the global variables as needed
    last7DaysData = last7DaysData[0];
    updateDataFromPostGres(last7DaysData);
    console.log("Last 7 Days Data:", last7DaysData);

  });
  
// Assuming you have an HTML form with input fields for startDate and endDate
const form = document.getElementById("dateFilterForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const startDate = document.getElementById("startDateInput").value;
  const endDate = document.getElementById("endDateInput").value;

  try {
    const response = await fetch(`/api/data-between-dates?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();
    betweenDaysData = data

    // Handle the fetched data (e.g., display it on the web page)
    
    console.log(data);
  } catch (error) {
    console.error("Error fetching data: ", error);
  }

  updateDataFromPostGres(betweenDaysData)

});

async function fetchEvents() {
  try {
    const response = await fetch("/api/get-events");
    if (response.ok) {
      events = await response.json();
      console.log("Fetched events:", events);
    } else {
      console.error("Failed to fetch events:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}

fetchEvents();

function createEventsDataDict(events) {
  // Initialize dictionaries
  

  // Create commName dictionary
  events.forEach(event => {
    commName[event._id]=event.name;
  });

  // Create eventNames dictionary
  events.forEach(event => {
    event.events.forEach(innerEvent => {
      eventNames[innerEvent.id]=innerEvent.name;
    });
  });

  return { commName, eventNames };
}
function getEventsData(){
  const { commName, eventNames } = createEventsDataDict(events);

console.log('commName:', commName);
console.log('eventNames:', eventNames); // Convert eventNames to an array of keys
}

function updateDataFromPostGres(arr){
  arr.forEach(row => {
    row.comm_name=commName[row.event_id];
    row.task_id = row.task_id.replace(/\s+/g, '');
    row.task_name=eventNames[row.task_id.replace(/\s+/g, '')];
})
}
