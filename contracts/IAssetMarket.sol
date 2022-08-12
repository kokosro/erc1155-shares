// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/// @title Interface of AssetMarket

interface IAssetMarket is IERC1155 {
    struct Asset {
        // total minted stakes for this asset
        uint256 totalSupply;
        // price of one unit of stake
        uint256 price;
        // owner of the asset
        address owner;
        // flag for enabling stakes transfers
        bool transferEnabled;
    }

    // event emitted when an asset is created
    event AssetCreated(uint256 id, uint256 price, address owner);
    // event emitted when transfers are enabled/disabled per asset
    event TransfersStatusChange(uint256 id, bool status);

    // @notice external function to create an asset
    // @dev function to create an asset
    // @param price The price of one unit of stake
    // @return the assigned id of created asset
    function createAsset(uint256 price) external returns (uint256 id);

    // @notice view function to get all assets ids owned by an address
    // @dev view function to get all assets ids owned by an address
    // @param owner Address for which we want the list of owned assets
    // @return array of asset ids
    function assetsOf(address owner) external view returns (uint256[] memory);

    // @notice view function to get full asset information
    // @dev view function to get full asset information
    // @param id The id of the asset
    // @return Asset structure
    function asset(uint256 id) external view returns (Asset memory);

    // @notice external payable function to buy stakes in an asset
    // @dev external payable function to buy stakes in an asset
    // @param id The id of the asset user wants to buy stakes in. Asset must exist
    function buy(uint256 id) external payable;

    // @notice external function to enable/disable stakes transfers for a specific asset
    // @dev external function to enable/disable stakes transfers for a specific asset. Can only be called by asset owner
    // @param id The id of the asset
    // @param status True to enable False to disable transfers
    function enableTransfers(uint256 id, bool status) external;

    // @notice view function to get the minimum required transfer stakes amount of an user for a specific asset
    // @dev view function to get the minimum required transfer stakes amount of an user for a specific asset
    // @param account The address
    // @param id The asset id
    // @return the minimum accepted transfer amount
    function minimumRequiredTransfer(address account, uint256 id)
        external
        view
        returns (uint256);
}
