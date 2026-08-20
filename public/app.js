import { HashConnect } from "hashconnect";
import { Client, LedgerId, ContractExecuteTransaction, ContractId, ContractFunctionParameters, AccountId, TransactionId } from "@hashgraph/sdk";

// Contract ID from our deployment
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID; 
const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;

let hashconnect;
let appMetadata = {
    name: "Hedera Voting DApp",
    description: "A decentralized voting application on Hedera",
    icons: ["https://www.hashpack.app/img/logo.svg"],
    url: window.location.origin
};
let connectedAccountId = "";
let userHasVoted = false;

document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsEl = document.getElementById('results');
    const winnerNameEl = document.getElementById('winner-name');
    const topicsContainer = document.getElementById('topics-container');
    const connectBtn = document.getElementById('connect-wallet-btn');

    // Fetch initial results from our local API
    const fetchResults = async () => {
        try {
            const response = await fetch('/api/results');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch data');
            }

            loadingEl.classList.add('hidden');
            resultsEl.classList.remove('hidden');
            
            // Check if connected user has voted
            if (connectedAccountId) {
                try {
                    const hvRes = await fetch(`/api/hasVoted/${connectedAccountId}`);
                    const hvData = await hvRes.json();
                    userHasVoted = hvData.hasVoted === true;
                } catch (e) {
                    console.error("Failed to check vote status:", e);
                }
            } else {
                userHasVoted = false;
            }

            if (userHasVoted) {
                winnerNameEl.parentElement.classList.remove('hidden');
                winnerNameEl.textContent = data.winner || 'No votes yet';
            } else {
                winnerNameEl.parentElement.classList.add('hidden');
            }

            topicsContainer.innerHTML = ''; // Clear container

            data.topics.forEach((topic, index) => {
                const card = document.createElement('div');
                card.className = 'topic-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                const displayVotes = userHasVoted ? topic.votes : '?';
                
                let buttonHTML = '';
                if (!userHasVoted) {
                    buttonHTML = `<button class="vote-btn" data-topic-index="${topic.id}" ${connectedAccountId ? '' : 'disabled'}>
                        ${connectedAccountId ? 'Vote for ' + topic.name : 'Connect to Vote'}
                    </button>`;
                } else {
                    buttonHTML = `<button class="vote-btn" disabled>Already Voted</button>`;
                }

                card.innerHTML = `
                    <div class="topic-name">${topic.name}</div>
                    <div class="topic-votes">${displayVotes}</div>
                    <div class="topic-label">Votes</div>
                    ${buttonHTML}
                `;
                
                topicsContainer.appendChild(card);
            });
            
            // Add event listeners to vote buttons
            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.addEventListener('click', handleVote);
            });

        } catch (err) {
            loadingEl.classList.add('hidden');
            errorEl.classList.remove('hidden');
            errorEl.textContent = err.message;
        }
    };

    // Initialize HashConnect v3
    const initHashConnect = async () => {
        try {
            hashconnect = new HashConnect(
                LedgerId.TESTNET,
                PROJECT_ID,
                appMetadata,
                false // disable debug
            );

            // Register event listeners
            hashconnect.pairingEvent.on((pairingData) => {
                connectedAccountId = pairingData.accountIds[0].toString();
                connectBtn.textContent = `Connected: ${connectedAccountId}`;
                connectBtn.style.background = 'var(--accent)';
                fetchResults(); // Re-render to enable buttons
            });

            hashconnect.connectionStatusChangeEvent.on((state) => {
                if (state === "Disconnected") {
                    connectedAccountId = "";
                    connectBtn.textContent = "Connect Wallet";
                    connectBtn.style.background = 'linear-gradient(135deg, var(--accent), var(--accent-hover))';
                    fetchResults();
                }
            });

            await hashconnect.init();
            
            // If already connected
            const state = hashconnect.connectedAccountIds;
            if (state && state.length > 0) {
                connectedAccountId = state[0].toString();
                connectBtn.textContent = `Connected: ${connectedAccountId}`;
                connectBtn.style.background = 'var(--accent)';
            }
        } catch (error) {
            console.error("HashConnect init error:", error);
        }
    };

    connectBtn.addEventListener('click', async () => {
        if (!connectedAccountId) {
            hashconnect.openPairingModal();
        } else {
            // Disconnect
            await hashconnect.disconnect();
            connectedAccountId = "";
            connectBtn.textContent = "Connect Wallet";
            connectBtn.style.background = 'linear-gradient(135deg, var(--accent), var(--accent-hover))';
            fetchResults();
        }
    });

    const handleVote = async (e) => {
        const topicIndex = e.target.getAttribute('data-topic-index');
        
        if (!connectedAccountId) return;
        
        try {
            e.target.textContent = "Voting...";
            e.target.disabled = true;

            const tx = new ContractExecuteTransaction()
                .setContractId(ContractId.fromString(CONTRACT_ID))
                .setGas(150000)
                .setFunction("vote", new ContractFunctionParameters().addUint256(Number(topicIndex)))
                .setTransactionId(TransactionId.generate(connectedAccountId));

            const client = Client.forTestnet();
            tx.freezeWith(client);

            // Execute the transaction directly through HashConnect
            const receipt = await hashconnect.sendTransaction(AccountId.fromString(connectedAccountId), tx);
            
            if (receipt.status.toString() === "SUCCESS") {
                userHasVoted = true;
                alert("Vote cast successfully!");
                await fetchResults(); 
            } else {
                throw new Error("Transaction failed with status: " + receipt.status.toString());
            }
        } catch (error) {
            console.error("Voting error:", error);
            alert("Error casting vote: " + error.message + "\n\n(See console for full details)");
            e.target.textContent = "Vote for " + e.target.closest('.topic-card').querySelector('.topic-name').textContent;
            e.target.disabled = false;
        }
    };

    await initHashConnect();
    await fetchResults();
});
