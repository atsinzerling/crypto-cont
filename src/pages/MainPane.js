import React from 'react';
import axios from 'axios';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
/*import { PieChart, Pie, Cell } from 'recharts';*/
import { Box, Button, Typography } from '@mui/material';
import moment from 'moment';
import './Dashboard.css';
import CryptoPieChart from './CryptoPieChart';
import CryptoCoinChart from './CryptoCoinChart';
import CryptoChart from './CryptoChart';
// import CustomTick from './CustomTick';

const holdings = [
    {
        date: '2023-12-01',
        bitcoin: 9,
        ethereum: 30,
        ripple: 0
    },
    {
        date: '2024-01-01',
        bitcoin: 10,
        ethereum: 30,
        ripple: 0
    },
    {
        date: '2024-02-01',
        bitcoin: 20,
        ethereum: 310,
        ripple: 10000,
    },
    {
        date: '2024-03-01',
        bitcoin: 15,
        ethereum: 340,
        ripple: 210000,
    },
    {
        date: '2024-04-01',
        bitcoin: 15,
        ethereum: 340,
        ripple: 300000,
    },
    {
        date: '2024-05-01',
        bitcoin: 15,
        ethereum: 330,
        ripple: 290000,
    },
    {
        date: '2024-06-01',
        bitcoin: 10,
        ethereum: 310,
        ripple: 300000,
    }
];

const COLORS = {
    'bitcoin': '#FFBB28',
    'ethereum': '#8884d8',
    'ripple': '#82ca9d',
    'litecoin': '#ffc658',
};



class MainPane extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            holdingsData: holdings,
            currentDataEntry: { total: 0, coins: {} },
            currentMetric: 'value', // for storing the current metric for the subgraphs
            visibleData: [], // Initial visible data here
            zoomLevel: 1,
            visibleStart: 0,
            visibleEnd: 0,
        };

        this.chartRef = React.createRef();
        this.wheelHandler = this.wheelHandler.bind(this);

        this.handleActiveTooltip = this.handleActiveTooltip.bind(this);
        this.CustomTooltip = this.CustomTooltip.bind(this);
        this.coins = [...new Set(this.state.holdingsData.flatMap(holding => Object.keys(holding).filter(key => key !== 'date')))];
        const startDatt = this.state.holdingsData.reduce((minDate, holding) => holding.date < minDate ? holding.date : minDate, this.state.holdingsData[0].date);
        this.startDate = (moment().diff(moment(startDatt), 'days') > 365 ? moment().subtract(365, 'days').format('YYYY-MM-DD') : startDatt)
    }

    componentDidMount() {
        this.fetchData();
        console.log("did mount");
        this.chartRef.current.addEventListener("wheel", this.wheelHandler);
    }

    componentWillUnmount() {
        this.chartRef.current.removeEventListener("wheel", this.wheelHandler);
    }

    /*    componentDidUpdate(prevProps, prevState) {
            if (prevState.startDate !== this.startDate || prevState.holdingsData !== this.state.holdingsData || prevState.coins !== this.coins) {
                this.fetchData();
                console.log("updating");
            }
            *//*EFFICIENCY*//*
}*/

    fetchData = async () => {
        console.log("fetching func");
        // Order the holdings data by date
        let holdingsData = [...this.state.holdingsData];
        holdingsData.sort((a, b) => moment(a.date).isBefore(moment(b.date)) ? -1 : 1);

        let currentHoldings = {};

        // Initialize chartData with an array covering each date from startDate to today
        let chartData = [];
        for (let m = moment(this.startDate); m.isSameOrBefore(moment(), 'day'); m.add(1, 'days')) {
            chartData.push({ date: m.format('YYYY-MM-DD') });
        }
        console.log(this.coins);
        for (const coin of this.coins) {
            // Fetch price data for the coin
            let daysToFetch = moment().diff(moment(this.startDate), 'days')
            const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin.toLowerCase()}/market_chart`, {
                params: {
                    vs_currency: 'usd',
                    days: (daysToFetch)
                }
            });
            console.log(response.data);
            // eslint-disable-next-line no-loop-func
            let uniqueDates = [];
            response.data.prices
                .filter(item => {
                    const date = moment(item[0]).format('YYYY-MM-DD');
                    if (uniqueDates.includes(date)) {
                        return false;
                    } else {
                        uniqueDates.push(date);
                        return true;
                    }
                })
                .sort((a, b) => {
                    return - new Date(a[0]) + new Date(b[0]);
                })
                // eslint-disable-next-line no-loop-func
                .forEach((item) => {


                    const date = moment(item[0]).format('YYYY-MM-DD');
                    const price = item[1];

                    if (!moment(date).isSameOrAfter(this.startDate)) {
                        return;
                    }

                    // Find the corresponding holding for the current date
                    const newHolding = holdingsData.find(holding => holding.date === date);
                    console.log(date, holdingsData[0].date)
                    console.log("newHolding", newHolding);
                    // Update currentHoldings if newHolding exists
                    if (!newHolding && moment(date).isAfter(moment(holdingsData[holdingsData.length - 1].date))) {
                        currentHoldings = { ...currentHoldings, ...holdingsData[holdingsData.length - 1] };
                    } else if (newHolding) {
                        currentHoldings = { ...currentHoldings, ...newHolding };
                    }
                    console.log("currentHoldings", currentHoldings, currentHoldings[coin]);
                    const quantity = currentHoldings[coin] || 0;
                    console.log("date", date);
                    // Find the corresponding data item for the current date
                    const dataItem = chartData.find(dataItem => dataItem.date === date);


                    /*dataItem[coin] = price * quantity; // Calculate value of holding
                    if (!dataItem.quantity) {
                        dataItem.quantity = {};
                    }
                    dataItem.quantity[coin] = quantity; // Add quantity to data item
                    dataItem.total = (dataItem.total || 0) + dataItem[coin]; // Update total value*/

                    if (!dataItem.coins) {
                        dataItem.coins = {};
                    }

                    if (!dataItem.coins[coin]) {
                        dataItem.coins[coin] = {};
                    }
                    dataItem.coins[coin].value = price * quantity;
                    dataItem.coins[coin].quantity = quantity;
                    dataItem.coins[coin].price = price;
                    dataItem.total = (dataItem.total || 0) + dataItem.coins[coin].value; // Update total value

                    //getting the investment
                    //should get the amount of investment by finding the previous date; smartly comparing the prev with the current,
                    //(check when prev should be zero), and then add the difference multiplied by the current price to the investment amount

                    const prevDay = moment(item[0]).subtract(1, 'days').format('YYYY-MM-DD');
                    const prevDayDataItem = chartData.find(dataItem => dataItem.date === prevDay);
                    console.log("prevDayDataItem", prevDayDataItem, " date", date);
                    let investedOnThisDate;
                    if (prevDayDataItem === undefined || prevDayDataItem.coins === undefined || prevDayDataItem.coins[coin] === undefined) {
                        investedOnThisDate = dataItem.coins[coin].value;
                    } else {
                        investedOnThisDate = prevDayDataItem.coins[coin].invested + (quantity - prevDayDataItem.coins[coin].quantity) * price;
                    }


                    dataItem.coins[coin].invested = investedOnThisDate;
                    dataItem.totalinvested = (dataItem.totalinvested || 0) + investedOnThisDate;

                });
        }

        console.log("chartData", chartData);

        this.setState({
            data: chartData,
            currentDataEntry: chartData[chartData.length - 1],
            visibleData: chartData,
            visibleEnd: chartData.length - 1,
        });
    };

    handleActiveTooltip = (payload) => {
        if (payload && payload.length) {
            this.setState({
                currentDataEntry: payload[0].payload,
            });
        }
    };

    CustomTooltip({ active, payload, label }) {
        console.log("tooltip called");
        if (active && payload && payload.length) {
            if (payload[0].payload.date !== this.state.currentDataEntry?.date) {
                console.log("tooltip update state");
                this.handleActiveTooltip(payload);
            }

            return (
                <div className="custom-tooltip">
                    <p>{`${payload[0].payload.total.toFixed(2)} USD`}</p>
                </div>
            );
        }

        return null;
    };

    handleMetricChange = (newMetric) => {
        this.setState({
            currentMetric: newMetric,
        });
    };

    wheelHandler(e) {
        e.preventDefault();
        const { zoomLevel, data, visibleData, visibleEnd, visibleStart } = this.state;

        // Change the zoom level based on the event delta. 
        // The exact formula will depend on how you want the zooming to behave.
        const newZoomLevel = Math.max(1, zoomLevel - e.deltaY * 0.0008);

        // Find the index of the current entry
        const currentIndex = data.findIndex(entry => entry.date === this.state.currentDataEntry?.date);
        /*const currentIndex = this.state.currentDataEntry?.date ;*/

        if (currentIndex === undefined) {
            return;
        }

        // Calculate the new visible range
        const visibleRange = Math.round(data.length / newZoomLevel);

        const visiblePositionRatio = (currentIndex - visibleStart) / (visibleEnd - visibleStart);

        // Calculate the new start and end indices based on the mouse position and the new range
        let newStart = Math.round(currentIndex - visiblePositionRatio * visibleRange);
        let newEnd = newStart + visibleRange;

        // Make sure the new range doesn't exceed the data boundaries
        if (newStart < 0) {
            newStart = 0;
            newEnd = newStart + visibleRange;
        }
        if (newEnd > data.length) {
            newEnd = data.length;
            newStart = newEnd - visibleRange;
        }

        // Update the state with the new zoom level and visible data
        this.setState({
            zoomLevel: newZoomLevel,
            visibleStart: newStart,
            visibleEnd: newEnd,
            visibleData: data.slice(newStart, newEnd),
            currentDataEntry: data[currentIndex],
        });
        console.log("Mouse wheeling over graph");
    };



    render() {
        return (
            <Box>
                <Box display="flex">
                    <Box ref={this.chartRef}>
                        <CryptoChart
                            visibleData={this.state.visibleData}
                            currentDataEntry={this.state.currentDataEntry}
                            visibleStart={this.state.visibleStart}
                            visibleEnd={this.state.visibleEnd}
                            handleActiveTooltip={this.handleActiveTooltip}
                            CustomTooltip={this.CustomTooltip}
                        />

                    </Box>

                    <Box ml={2}>
                        <CryptoPieChart data={this.state.currentDataEntry} colors={COLORS} />
                        <Typography >{`Date: ${this.state.currentDataEntry?.date ? moment(this.state.currentDataEntry.date).format('MMM D, YYYY') : 'Date not available'}`}</Typography >
                        <Typography >{`Profit: ${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(((this.state.currentDataEntry?.total / this.state.currentDataEntry?.totalinvested - 1) * 100))} %`}</Typography >
                        <Typography >{`Total value: ${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(this.state.currentDataEntry?.total)} USD`}</Typography >
                        <Typography >{`Total invested: ${new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(this.state.currentDataEntry?.totalinvested)} USD`}</Typography >

                    </Box>
                    <Box>

                        {this.state.currentDataEntry && this.state.currentDataEntry.coins ? (Object.keys(this.state.currentDataEntry?.coins).map((coin) => (
                            <Typography key={coin}>
                                <span style={{ color: COLORS[coin] }}>{`${coin}`}</span>{`: ${(this.state.currentDataEntry.coins[coin]?.value / this.state.currentDataEntry.total * 100).toFixed(1)} %`}
                                {/*<span style={{ color: COLORS[coin] }}>{`${coin}`}</span>{`: Quantity = ${this.state.currentDataEntry.coins[coin].quantity}, Total Value = ${this.state.currentDataEntry.coins[coin].value.toFixed(2)} USD`}*/}
                            </Typography>
                        ))) : null}
                    </Box>
                </Box>
                <Box>
                    <Typography variant="h2">Coins details</Typography>
                    <Box className='display-metric-switch-buttons'>
                        <Button
                            variant={this.state.currentMetric === 'value' ? 'contained' : 'outlined'}
                            onClick={() => this.handleMetricChange('value')}
                        >
                            Show Value
                        </Button>

                        <Button
                            variant={this.state.currentMetric === 'price' ? 'contained' : 'outlined'}
                            onClick={() => this.handleMetricChange('price')}
                        >
                            Show Price
                        </Button>
                    </Box>
                </Box>
                {this.coins.map((coin) => (
                    <CryptoCoinChart
                        key={coin}
                        coin={coin}
                        data={this.state.data}
                        color={COLORS[coin]}
                        currentMetric={this.state.currentMetric} // Pass the currentMetric as a prop to CryptoCoinChart
                    />
                ))}
            </Box>
        );
    }
}

export default MainPane;