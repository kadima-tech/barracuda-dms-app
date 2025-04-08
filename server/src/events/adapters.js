"use strict";
// import { logger } from '@kadima-tech/micro-service-base';
// import { updateAssetByPath } from '../assets/service';
// import { FinalizeObjectEvent } from './generated/finalizeObjectEvent';
// export const finalizeObjectAdapter = async (data: Uint8Array) => {
//   const event = JSON.parse(
//     new TextDecoder().decode(data)
//   ) as FinalizeObjectEvent;
//   const filePath = event.name;
//   if (!event || !event.name) {
//     return logger.warn({
//       code: `assets/lifecycle/upload/invalid-event`,
//       message: 'Expectee message name to be available, got undefined',
//       event,
//     });
//   }
//   if (event.name !== 'OBJECT_FINALIZED') {
//     return logger.debug('Only handling OBJECT_FINALIZED for now');
//   }
//   await updateAssetByPath(filePath, {
//     contentSize: BigInt(event.size),
//     contentType: event.contentType,
//   });
// };
