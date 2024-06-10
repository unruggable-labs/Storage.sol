// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.23;

library StorageCoder {

	function decodeValueArray(bytes memory src, uint256 step, bool padRight) internal pure returns (uint256 dst) {
		unchecked {
			if (step == 0 || step > 32 || src.length < 32) return 0;
			uint256 srcp;
			assembly { srcp := add(src, 32) }
			uint256 len;
			assembly { len := mload(srcp) }
			uint256 pack = 32 / step; // elements per slot in storage
			if (src.length != (1 + (len + pack - 1) / pack) << 5) return 0;
			step <<= 3; // bytes to bits
			uint256 mask = (1 << step) - 1;
			uint256 end;
			assembly {
				dst := mload(64)
				end := add(dst, shl(5, add(1, len)))
				mstore(64, end)
				mstore(dst, len)
			}
			uint256 dstp = dst;
			while (dstp < end) {
				// assembly { 
				// 	srcp := add(srcp, 32)
				// 	let word := mload(srcp) 
				// 	for { let i := 0 } and(lt(i, pack), lt(dstp, end)) { i := add(i, 1) } {
				// 		dstp := add(dstp, 32)
				// 		mstore(dstp, and(word, mask))
				// 		word := shr(step, word)
				// 	}
				// }
				srcp += 32;
				uint256 word;
				assembly { word := mload(srcp) }
				for (uint256 i; dstp < end && i < pack; i += 1) {
					dstp += 32;
					if (padRight) {
						assembly { mstore(dstp, shl(sub(256, step), and(word, mask))) }
					} else {
						assembly { mstore(dstp, and(word, mask)) }
					}
					word >>= step;
				}
			}
		}
	}

}
