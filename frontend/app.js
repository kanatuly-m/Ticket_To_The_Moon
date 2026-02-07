let provider;
let signer;
let moonTripContract;
let moonTokenContract;

const MOON_TRIP_ADDRESS="0x1c4B152aC7F1eD4A0d948f253B2610344730bFb3";
const MOON_TOKEN_ADDRESS="0x5576622300664eF81f80Ac9F7898c3ED1310dB83";

const connectBtn = document.getElementById('connect-wallet-btn');
const userAddressDipslay = document.getElementById('user-address');
const ethBalanceDisplay = document.getElementById('eth-balance');
const tokenBalanceDisplay = document.getElementById('token-balance');
const networkNameDisplay = document.getElementById('network-name');
const statusMessage = document.getElementById('status-message');


async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            const network = await provider.getNetwork();
            if (network.chainId !== 11155111) {
                alert("Please switch to Sepolia Testnet!");
                return;
            }

            moonTripContract = new ethers.Contract(MOON_TRIP_ADDRESS, MOON_TRIP_ABI, signer);
            moonTokenContract = new ethers.Contract(MOON_TOKEN_ADDRESS, MOON_TOKEN_ABI, signer);
            updateUI(accounts[0]);
        } catch (error) {
            console.error("Connection failed", error);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function updateUI(address) {
    userAddressDipslay.innerText = `${address.substring(0, 6)}...${address.substring(38)}`;
    userAddressDipslay.classList.remove('hidden');
    connectBtn.classList.add('hidden');
    
    const ethBalance = await provider.getBalance(address);
    ethBalanceDisplay.innerText = ethers.utils.formatEther(ethBalance).substring(0, 6);

    const tokenBalance = await moonTokenContract.balanceOf(address);
    tokenBalanceDisplay.innerText = ethers.utils.formatUnits(tokenBalance, 18);
    
    networkNameDisplay.innerText = "Sepolia Online";
    document.getElementById('network-status').classList.replace('offline', 'online');
    statusMessage.innerText = "Astronaut connected. Ready for launch!";
    refreshData();
}

async function buyTicket(amount) {
    try {
        statusMessage.innerText = "Processing transaction..."; 
        const tx = await moonTripContract.contribute(1, { 
            value: ethers.utils.parseEther(amount.toString())
        });
        await tx.wait(); 
        statusMessage.innerText = "Ticket secured! MoonMiles minted.";
        updateUI(await signer.getAddress());
    } catch (error) {
        statusMessage.innerText = "Error: " + error.reason;
    }
}


document.getElementById('create-campaign-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('new-title').value;
    const goal = document.getElementById('new-goal').value;
    const duration = document.getElementById('new-duration').value;

    try {
        const tx = await moonTripContract.createCampaign(title, goal, duration);
        await tx.wait();
        alert("Mission Initialized!");
    } catch (error) {
        console.error(error);
    }
});

document.getElementById('btn-ticket-standard').onclick = () => buyTicket(0.01);
document.getElementById('btn-ticket-vip').onclick = () => buyTicket(0.1);
connectBtn.onclick = connectWallet;

async function refreshData() {
    const address = await signer.getAddress();
    
    const ethBalance = await provider.getBalance(address);
    document.getElementById('eth-balance').innerText = ethers.utils.formatEther(ethBalance).slice(0, 6);

    const tokenBalance = await moonTokenContract.balanceOf(address);
    document.getElementById('token-balance').innerText = ethers.utils.formatUnits(tokenBalance, 18);

    const campaign = await moonTripContract.campaigns(1);
    document.getElementById('campaign-title').innerText = campaign.title;
    document.getElementById('campaign-goal').innerText = ethers.utils.formatEther(campaign.fundingGoal);
    document.getElementById('campaign-raised').innerText = ethers.utils.formatEther(campaign.raisedAmount);
}

window.addEventListener('load', () => {
    const connectBtn = document.getElementById('connect-wallet-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
        console.log("Event listener attached to Connect button");
    } else {
        console.error("Connect button not found in HTML!");
    }

    const stdBtn = document.getElementById('btn-ticket-standard');
    if (stdBtn) stdBtn.onclick = () => buyTicket(0.01);

    const vipBtn = document.getElementById('btn-ticket-vip');
    if (vipBtn) vipBtn.onclick = () => buyTicket(0.1);
});
