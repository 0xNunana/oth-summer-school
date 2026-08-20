import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import {
  Client,
  AccountId,
  PrivateKey,
  ContractId,
  ContractCallQuery,
  ContractFunctionParameters,
  Hbar
} from '@hashgraph/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Set your contract ID here after deploying
const CONTRACT_ID = process.env.CONTRACT_ID || "0.0.10152656"; 

function makeTestnetClient() {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKeyRaw = process.env.HEDERA_OPERATOR_KEY;
  if (!operatorId || !operatorKeyRaw) {
    throw new Error("Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env");
  }
  let operatorKey;
  try {
    operatorKey = PrivateKey.fromStringDer(operatorKeyRaw);
  } catch {
    operatorKey = PrivateKey.fromStringECDSA(operatorKeyRaw);
  }
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(operatorId), operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(20));
  return client;
}

const client = makeTestnetClient();

app.get('/api/results', async (req, res) => {
    if (!CONTRACT_ID) {
        return res.status(400).json({ error: "CONTRACT_ID not set in environment or server" });
    }
    
    try {
        const contractId = ContractId.fromString(CONTRACT_ID);
        
        // 1. Get Topic Count
        const countQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getTopicCount");
        const countResult = await countQuery.execute(client);
        const topicCount = countResult.getUint256(0).toNumber();

        const topics = [];
        for (let i = 0; i < topicCount; i++) {
            // Get Name
            const nameQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction("getTopicName", new ContractFunctionParameters().addUint256(i));
            const nameResult = await nameQuery.execute(client);
            const name = nameResult.getString(0);
            
            // Get Votes
            const voteQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(100000)
                .setFunction("getTopicVotes", new ContractFunctionParameters().addUint256(i));
            const voteResult = await voteQuery.execute(client);
            const votes = voteResult.getUint256(0).toNumber();
            
            topics.push({ id: i, name, votes });
        }
        
        // Get Winning Topic
        const winQuery = new ContractCallQuery()
            .setContractId(contractId)
            .setGas(100000)
            .setFunction("getWinningTopic");
        const winResult = await winQuery.execute(client);
        const winner = winResult.getString(0);

        res.json({ topics, winner });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
