// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.23;

error InvalidStorageArrayEncoding();

library StorageArray {

	function decode(bytes memory src, uint256 step, bool copy) internal pure returns (uint256 dstp) {
		unchecked {
			if (step == 0 || src.length < 32) revert InvalidStorageArrayEncoding();
			uint256 len = uint256(bytes32(src));
			uint256 size = (step + 31) >> 5;
			if (size > 1) {
				if (src.length != (1 + len * size) << 5) revert InvalidStorageArrayEncoding();
				if (copy) src = bytes.concat(src);
				assembly { dstp := src }
			} else {
				uint256 pack = 32 / step;
				if (src.length != (1 + (len + pack - 1) / pack) << 5) revert InvalidStorageArrayEncoding();
				step <<= 3;
				uint256 mask = (1 << step) - 1;
				bytes memory buf = new bytes(len * size);
				uint256 i;
				uint256 srcp;
				assembly { 
					srcp := add(src, 32)
					dstp := buf
				}
				while (i < len) {
					srcp += 32;
					uint256 word;
					assembly { word := mload(srcp) }
					for (uint256 e = i + pack; i < e && i < len; i += 1) {
						dstp += 32;
						assembly { mstore(dstp, and(word, mask)) }
						word >>= step;
					}
				}
				assembly {
					mstore(buf, len)
					dstp := buf
				}
			}
		}
	}

}