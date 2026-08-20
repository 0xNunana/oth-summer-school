// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Topic {
        string name;
        uint256 voteCount;
    }

    address public owner;
    Topic[] public topics;
    
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public blocklist;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier canVote() {
        require(!hasVoted[msg.sender], "You have already voted");
        require(!blocklist[msg.sender], "You are on the blocklist and cannot vote");
        _;
    }

    // Constructor
    constructor(string[] memory _topicNames) {
        owner = msg.sender;
        for (uint i = 0; i < _topicNames.length; i++) {
            topics.push(Topic({
                name: _topicNames[i],
                voteCount: 0
            }));
        }
    }

    // Core functionality
    function vote(uint256 _topicIndex) public canVote {
        require(_topicIndex < topics.length, "Invalid topic index");
        
        hasVoted[msg.sender] = true;
        topics[_topicIndex].voteCount += 1;
    }

    function addToBlocklist(address _voter) public onlyOwner {
        blocklist[_voter] = true;
    }
    
    function removeFromBlocklist(address _voter) public onlyOwner {
        blocklist[_voter] = false;
    }

    // View functions for fetching data
    function getTopicCount() public view returns (uint256) {
        return topics.length;
    }

    function getTopicName(uint256 _topicIndex) public view returns (string memory) {
        require(_topicIndex < topics.length, "Invalid topic index");
        return topics[_topicIndex].name;
    }

    function getTopicVotes(uint256 _topicIndex) public view returns (uint256) {
        require(_topicIndex < topics.length, "Invalid topic index");
        return topics[_topicIndex].voteCount;
    }

    function getWinningTopic() public view returns (string memory winningName) {
        require(topics.length > 0, "No topics available");
        
        uint256 winningVoteCount = 0;
        uint256 winningTopicIndex = 0;
        
        for (uint i = 0; i < topics.length; i++) {
            if (topics[i].voteCount > winningVoteCount) {
                winningVoteCount = topics[i].voteCount;
                winningTopicIndex = i;
            }
        }
        
        return topics[winningTopicIndex].name;
    }
}
