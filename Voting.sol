// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    address public owner;
    string[] private topics;
    uint256[] private voteCounts;
    mapping(address => bool) private hasVoted;
    mapping(address => bool) private blacklist;

    // The topics are defined by the constructor.
    constructor(string memory topic1, string memory topic2, string memory topic3) {
        owner = msg.sender;
        topics.push(topic1);
        topics.push(topic2);
        topics.push(topic3);
        voteCounts = new uint256[](3);
    }

    // Only the owner (deployer) can block an account from voting.
    function addToBlacklist(address account) external {
        require(msg.sender == owner, "Only the owner can blacklist");
        blacklist[account] = true;
    }

    // Everybody can vote exactly once, unless blacklisted.
    function vote(uint256 topicIndex) external {
        require(topicIndex < topics.length, "Topic does not exist");
        require(!blacklist[msg.sender], "You are blacklisted");
        require(!hasVoted[msg.sender], "You have already voted");
        hasVoted[msg.sender] = true;
        voteCounts[topicIndex] += 1;
    }

    function getTopicCount() external view returns (uint256) {
        return topics.length;
    }

    function getTopic(uint256 topicIndex) external view returns (string memory) {
        return topics[topicIndex];
    }

    // The result of the voting can be printed (queried per topic).
    function getVotes(uint256 topicIndex) external view returns (uint256) {
        return voteCounts[topicIndex];
    }
}
