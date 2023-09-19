let tickers = JSON.parse(localStorage.getItem('tickers')) || [];
let lastPrices = {};
let counter = 60;


const populateDropdown = (data) => {
    data = data.slice(0,20); //Slicing the data, for now

    const dropdown = document.getElementById('ticker-select');

    data.forEach((ticker) => {
        const option = document.createElement('option');
        option.value = ticker.symbol;
        option.text = ticker.symbol + " : " + ticker.name;
        dropdown.appendChild(option);
    });
    const option = document.createElement('option');
        option.value = "other";
        option.text = "Other";
        dropdown.appendChild(option);
}

const toggleTickerInput = () => {
    const tickerIn = $('#ticker-in');
    const tickerSelect = $('#ticker-select');
    if (tickerSelect.val() === 'other') {
        tickerIn.show();
    } else {
        tickerIn.hide();
    }
}

// Function to fetch JSON data asynchronously
const fetchJSONData = async () => {
    try {
        const response = await fetch('/data');
        if (!response.ok) {
            throw new Error('Error fetching tickers');
        }
        const data = await response.json();
        populateDropdown(data);
    } catch (error) {
        console.error('Error:', error);
    }
}


const startUpdateCycle = () => {
    updatePrices();
    setInterval(()=>{
        counter--;
        $('#counter').text(counter);
        if(counter <= 0){
            updatePrices();
            counter = 15;
        }
    }, 1000);
}

const addTickerToGrid = (ticker) => {
    const grid = $('#tickers-grid');
    grid.append(`<div id='${ticker}' class='stock-box'> <h2>${ticker}</h2> <p id='${ticker}-price'></p> <p id='${ticker}-pct'></p> <button class='remove-btn' data-ticker='${ticker}'> Remove </button> </div>`);
}

const updatePrices = () => {
    tickers.forEach(ticker => {
        $.ajax({
            url: '/get-stock-data',
            type: 'POST',
            data: JSON.stringify({ticker: ticker}),
            contentType: 'application/json',
            dataType: 'json',
            success: (data) => {
                const percentageChange = ((data.currentPrice - data.openingPrice) / data.openingPrice) * 100;
                let colorClass;
                if(percentageChange <= -2){
                    colorClass = 'dark-red';
                }
                else if(percentageChange < 0){
                    colorClass = 'red';
                }
                else if(percentageChange == 0){
                    colorClass = 'gray';
                }
                else if(percentageChange <= 2){
                    colorClass = 'green';
                }
                else{
                    colorClass = 'dark-green';
                }

                $(`#${ticker}-price`).text(`$${data.currentPrice.toFixed(2)}`);
                $(`#${ticker}-pct`).text(`${percentageChange.toFixed(2)}%`);

                $(`#${ticker}-price`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
                $(`#${ticker}-pct`).removeClass('dark-red red gray green dark-green').addClass(colorClass);
                

                let flashClass;
                if(lastPrices[ticker] > data.currentPrice){
                    flashClass = 'red-flash';
                }
                else if(lastPrices[ticker] < data.currentPrice){
                    flashClass = 'green-flash';
                }
                else{
                    flashClass = 'gray-flash';
                }

                lastPrices[ticker] = data.currentPrice;

                $(`#${ticker}`).addClass(flashClass);
                setTimeout(()=>{
                    $(`#${ticker}`).removeClass(flashClass);
                }, 1000);
            }
        });
    });
}

$(document).ready(()=>{
    fetchJSONData();
    toggleTickerInput();

    tickers.forEach((ticker) => {
        addTickerToGrid(ticker);
    });

    updatePrices();

    $('#ticker-select').on('change', toggleTickerInput);

    $('#ticker-form').submit((event) => {
        event.preventDefault();

        let newTicker = $('#ticker-select').val();
        console.log(newTicker);
        if (newTicker === 'other') {
            newTicker = $('#ticker-in').val().toUpperCase();
        }

        if(!tickers.includes(newTicker)){
            tickers.push(newTicker);
            localStorage.setItem('tickers', JSON.stringify(tickers));
            addTickerToGrid(newTicker);
        }
        
        $('#ticker-in').val('');
        $('#tickerSelect').val('');
        $('#ticker-in').hide();
        updatePrices();
    });
    
    $('#tickers-grid').on('click', '.remove-btn', function (){
        let tickerToRemove = $(this).data('ticker');
        console.log(tickerToRemove)
        tickers = tickers.filter((ticker) => {
            return ticker !== tickerToRemove
        });
        
        localStorage.setItem('tickers', JSON.stringify(tickers));
        $(`#${tickerToRemove}`).remove();
    });

    startUpdateCycle();

});
