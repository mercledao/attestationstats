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
    countRowsAndUniqueCommNames(last7DaysData,"totalcount","uniqueCommNamesTable");
    stackedBarChart(last7DaysData, "stackedBarChart7day");
    hideLoadingAnimation();
    createStackedBarCharts(last7DaysData);
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
  countRowsAndUniqueCommNames(betweenDaysData,"totalcountdate","uniqueCommNamesTableDate");
  stackedBarChart(betweenDaysData,"stackedBarChartbetweenDays");


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

function stackedBarChart(arr,id){
  
  
  const groupedData = {};

  arr.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString(); // Extract date portion
    const { comm_name } = item;
    if (!groupedData[date]) {
      groupedData[date] = {};
    }
    if (!groupedData[date][comm_name]) {
      groupedData[date][comm_name] = 0;
    }
    groupedData[date][comm_name]++;
  });
  
  // Extract unique comm_names for legend
  const uniqueEventNames = [...new Set(arr.map(item => item.comm_name))];
  
  // Create datasets for the chart
  const datasets = uniqueEventNames.map(eventName => {
    return {
      label: eventName,
      data: Object.values(groupedData).map(dateData => dateData[eventName] || 0),
      backgroundColor: getRandomColor(), // Replace with desired colors
    };
  });
  
 
  
  // Chart configuration
  const chartConfig = {
    type: 'bar',
    data: {
      labels: Object.keys(groupedData),
      datasets: datasets,
    },
    options: {
      scales: {
        x: {
          stacked: true,
          grid: {
            color: 'grey', // Change the color of x-axis grid lines
          },
          ticks: {
            color: 'white', // Change the color of x-axis ticks (labels)
          }
        },
        y: {
          stacked: true,
          grid: {
            color: 'grey', // Change the color of x-axis grid lines
          },
          ticks: {
            color: 'white', // Change the color of x-axis ticks (labels)
          }
        },
      },
      plugins:{
        legend:{
          labels:{
            color: 'white', // Change label font color to white
          }
        }
      }
    },
  };
  // Create and render the chart
  const ctx = document.getElementById(id).getContext('2d');
  new Chart(ctx, chartConfig);
}



function countRowsAndUniqueCommNames(data,totalid,tableid) {
  // Initialize variables to store counts
  let totalRowCount = 0;
  const uniqueCommNames = {};

  // Loop through the data array
  data.forEach(item => {
    // Count total rows
    totalRowCount++;

    // Count unique comm_names
    const commName = item.comm_name;
    if (!uniqueCommNames[commName]) {
      uniqueCommNames[commName] = 1;
    } else {
      uniqueCommNames[commName]++;
    }
  });

  // Create a 2D array from the uniqueCommNames object
  const uniqueCommNamesArray = Object.entries(uniqueCommNames).map(([commName, count]) => [commName, count]);

  document.getElementById(totalid).innerHTML=totalRowCount;
  uniqueCommNamesArray.sort((a, b) => b[1] - a[1]);
  generateUniqueCommNamesTable(uniqueCommNamesArray,tableid);
  // console.log('Total Rows:', totalRowCount);
  // console.log('Unique Comm Names and Counts:', uniqueCommNamesArray);
}




 // Generate random colors for the chart
 function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
function generateUniqueCommNamesTable(data,tableid) {
  // Get a reference to the div where the table will be placed
  const tableContainer = document.getElementById(tableid);

  // Create a table element
  const table = document.createElement('table');

  // Create the table header row
  const headerRow = table.createTHead().insertRow(0);
  headerRow.insertCell(0).textContent = 'Community Name';
  headerRow.insertCell(1).textContent = 'Count';

  // Create table body and populate rows
  const tbody = table.createTBody();
  data.forEach(item => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = item[0]; // Community Name
    row.insertCell(1).textContent = item[1]; // Count
  });

  // Append the table to the container
  tableContainer.appendChild(table);
}

// When data fetching starts, show the loading animation
function showLoadingAnimation() {
  document.getElementById('loading-container').style.display = 'block';
}

// When data fetching is completed, hide the loading animation
function hideLoadingAnimation() {
  document.getElementById('loading-container').style.display = 'none';
}

// Example: Simulate data fetching with a delay (replace with your actual data fetching logic)
function fetchData() {
  showLoadingAnimation();
}

// Call the fetchData function to start fetching data
fetchData();




function createStackedBarCharts(data) {
  // Get the unique comm_names from the data
  const uniqueCommNames = [...new Set(data.map(item => item.comm_name))];
  console.log("Uniue Comm Names",uniqueCommNames);
  // Reference to the campaignwise div
  const campaignwiseDiv = document.getElementById('campaignwise');

  // Create a chart for each unique comm_name
  uniqueCommNames.forEach(commName => {
    // Filter data for the current comm_name

    const commData = data.filter(item => item.comm_name === commName);
    // console.log("CommWise Data",commData);
      const groupedData = {};

    commData.forEach(item => {
    const date = new Date(item.created_at).toLocaleDateString(); // Extract date portion
    const { task_name } = item;
    if (!groupedData[date]) {
      groupedData[date] = {};
    }
    if (!groupedData[date][task_name]) {
      groupedData[date][task_name] = 0;
    }
    groupedData[date][task_name]++;
  });

    // Get unique task_names for stacking
    const uniqueTaskNames = [...new Set(commData.map(item => item.task_name))];

    // Initialize datasets for the chart
    const datasets = uniqueTaskNames.map(taskName => {
      return {
        label: taskName,
        data: Object.values(groupedData).map(dateData => dateData[taskName] || 0),
        backgroundColor: getRandomColor(),
      };
    });

    // Create a div to hold the chart
    const commHeading = document.createElement('h2');
    commHeading.innerHTML=commData[0].comm_name;
    campaignwiseDiv.appendChild(commHeading);

    const chartDiv = document.createElement('div');
    chartDiv.classList.add('chart-container');
    campaignwiseDiv.appendChild(chartDiv);

    // Create the canvas element for the chart
    const canvas = document.createElement('canvas');
    chartDiv.appendChild(canvas);

    // Create the chart using Chart.js
    
  // Chart configuration
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(groupedData),
      datasets: datasets,
    },
    options: {
      scales: {
        x: {
          stacked: true,
          grid: {
            color: 'grey', // Change the color of x-axis grid lines
          },
          ticks: {
            color: 'white', // Change the color of x-axis ticks (labels)
          }
        },
        y: {
          stacked: true,
          grid: {
            color: 'grey', // Change the color of x-axis grid lines
          },
          ticks: {
            color: 'white', // Change the color of x-axis ticks (labels)
          }
        },
      },
      plugins:{
        legend:{
          labels:{
            color: 'white', // Change label font color to white
          }
        }
      }
    },
  });

  });
}