// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import {Destroyable} from "./Destroyable.sol";

import {IAssetMarket} from "./IAssetMarket.sol";

// @title AssetMarket

contract AssetMarket is IAssetMarket, ERC1155, Destroyable, Initializable {
    // @inheritdoc IAssetMarket
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    // @dev counter for generating asset ids
    Counters.Counter private _assetsIds;

    // @dev mapping of assetId to asset info
    mapping(uint256 => Asset) assets;

    // @dev mapping of sum of all transfers of each asset per user
    mapping(uint256 => mapping(address => uint256)) minimumTransferAmount;

    // @dev index of all assets owned by a specific address
    mapping(address => uint256[]) ownerAssets;

    modifier assetExists(uint256 id) {
        require(_assetsIds.current() >= id, "asset does not exist");
        _;
    }

    modifier onlyAssetOwner(uint256 id) {
        require(assets[id].owner == msg.sender, "not asset owner");
        _;
    }

    constructor() ERC1155("") {}

    function initialize(string memory uri_) public initializer {
        _setURI(uri_);
    }

    // @notice external function to enable/disable stakes transfers for a specific asset
    // @dev external function to enable/disable stakes transfers for a specific asset. Can only be called by asset owner. Will emit TransfersStatusChange on success
    // @param id The id of the asset
    // @param status True to enable False to disable transfers
    function enableTransfers(uint256 id, bool status)
        external
        override
        assetExists(id)
        onlyAssetOwner(id)
    {
        if (assets[id].transferEnabled != status) {
            assets[id].transferEnabled = status;
            emit TransfersStatusChange(id, status);
        }
    }

    // @notice external function to create an asset
    // @dev function to create an asset. Will emit AssetCreated event on success
    // @param price The price of one unit of stake
    // @return the assigned id of created asset
    function createAsset(uint256 price) external override returns (uint256 id) {
        require(price > 0, "price must be set");
        _assetsIds.increment();
        id = _assetsIds.current();
        assets[id] = Asset({
            owner: msg.sender,
            price: price,
            transferEnabled: false,
            totalSupply: 0
        });
        ownerAssets[msg.sender].push(id);

        emit AssetCreated(id, price, msg.sender);

        return id;
    }

    // @notice view function to get all assets ids owned by an address
    // @dev view function to get all assets ids owned by an address
    // @param _owner Address for which we want the list of owned assets
    // @return array of asset ids
    function assetsOf(address _owner)
        external
        view
        override
        returns (uint256[] memory)
    {
        return ownerAssets[_owner];
    }

    // @notice view function to get full asset information
    // @dev view function to get full asset information
    // @param id The id of the asset
    // @return Asset structure
    function asset(uint256 id) external view override returns (Asset memory) {
        return assets[id];
    }

    // @notice external payable function to buy stakes in an asset
    // @dev external payable function to buy stakes in an asset
    // @param id The id of the asset user wants to buy stakes in. Asset must exist
    function buy(uint256 id) external payable override assetExists(id) {
        require(msg.value >= assets[id].price, "not enough payment");
        uint256 stakesToMint = msg.value.div(assets[id].price);
        uint256 payment = stakesToMint.mul(assets[id].price);
        uint256 change = msg.value.sub(payment);
        _mint(msg.sender, id, stakesToMint, "");
        assets[id].totalSupply = assets[id].totalSupply.add(stakesToMint);
        payable(assets[id].owner).transfer(msg.value);
        if (change > 0) {
            payable(msg.sender).transfer(change);
        }
    }

    // @notice view function to get the minimum required transfer stakes amount of an user for a specific asset
    // @dev view function to get the minimum required transfer stakes amount of an user for a specific asset
    // @param account The address
    // @param id The asset id
    // @return the minimum accepted transfer amount
    function minimumRequiredTransfer(address account, uint256 id)
        external
        view
        override
        returns (uint256)
    {
        return minimumTransferAmount[id][account];
    }

    function _beforeTokenTransfer(
        address,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory
    ) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(
                    assets[ids[i]].transferEnabled,
                    "asset transfers paused"
                );
                require(
                    amounts[i] >= minimumTransferAmount[ids[i]][from],
                    "minimum required transfer amount not met"
                );
                minimumTransferAmount[ids[i]][from] = minimumTransferAmount[
                    ids[i]
                ][from].add(amounts[i]);
            }
        }
    }
}
