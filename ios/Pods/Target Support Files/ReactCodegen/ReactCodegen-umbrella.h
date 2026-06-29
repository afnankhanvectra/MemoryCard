#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "RCTModulesConformingToProtocolsProvider.h"
#import "RCTThirdPartyComponentsProvider.h"
#import "react/renderer/components/RNSoundSpec/ComponentDescriptors.h"
#import "react/renderer/components/RNSoundSpec/EventEmitters.h"
#import "react/renderer/components/RNSoundSpec/Props.h"
#import "react/renderer/components/RNSoundSpec/RCTComponentViewHelpers.h"
#import "react/renderer/components/RNSoundSpec/ShadowNodes.h"
#import "react/renderer/components/RNSoundSpec/States.h"
#import "RNSoundSpec/RNSoundSpec.h"
#import "RNSoundSpecJSI.h"

FOUNDATION_EXPORT double ReactCodegenVersionNumber;
FOUNDATION_EXPORT const unsigned char ReactCodegenVersionString[];

