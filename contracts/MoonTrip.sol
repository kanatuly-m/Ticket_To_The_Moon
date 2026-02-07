// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MoonToken.sol";

contract MoonTrip {
    struct Participant {
        address astronaut;
        string ticketType;
        uint256 amount;
        uint256 timestamp;
    }
    struct Campaign {
        string title;
        uint256 fundingGoal;
        uint256 raisedAmount;
        uint256 deadline;
        bool finalized;
        address winner;
        Participant[] queue;
    }

    MoonToken public rewardToken;
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;

    constructor(address _tokenAddress) {
        rewardToken = MoonToken(_tokenAddress);
    }

    function createCampaign(string memory _title, uint256 _goalEth, uint256 _durationMinutes) public {
        campaignCount++;
        Campaign storage c = campaigns[campaignCount];
        c.title = _title;
        c.fundingGoal = _goalEth * 1 ether;
        c.deadline = block.timestamp + (_durationMinutes * 1 minutes);
        c.finalized = false;
    }

    function contribute(uint256 _campaignId) public payable {
        Campaign storage c = campaigns[_campaignId];
        require(block.timestamp < c.deadline, "Mission expired");
        require(msg.value == 0.01 ether || msg.value == 0.1 ether, "Incorrect ticket price");

        string memory tType = msg.value == 0.1 ether ? "VIP" : "Standard";
        
        c.queue.push(Participant({
            astronaut: msg.sender,
            ticketType: tType,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        c.raisedAmount += msg.value;

        rewardToken.mint(msg.sender, (msg.value * 1000)); 
    }

    function finalizeCampaign(uint256 _campaignId) public {
        Campaign storage c = campaigns[_campaignId];
        require(block.timestamp >= c.deadline, "Deadline not reached");
        require(!c.finalized, "Already finalized");

        if (c.queue.length > 0) {
            c.winner = c.queue[0].astronaut;
        }

        c.finalized = true;
    }

    function getQueue(uint256 _campaignId) public view returns (Participant[] memory) {
        return campaigns[_campaignId].queue;
    }
}
