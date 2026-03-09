#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HabitBridge, NSObject)

RCT_EXTERN_METHOD(syncSnapshot:(NSString *)jsonString
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reloadWidget:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
