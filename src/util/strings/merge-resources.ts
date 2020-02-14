import {Strings} from "../../contexts/strings"

/* Using @ts-ignore in several places throughout this file
 * in order to suppress the compilation error TS7053:
 *
 * Element implicitly has an 'any' type because expression of type 'string'
 * can't be used to index type 'Strings'. No index signature with
 * a parameter of type 'string' was found on type 'Strings'.
 */

function logFallbackForObject(structureSoFar: string): void {
  console.warn(`Falling back with object property \`${structureSoFar}\``)
}

function logFallback(fallbackProperty: string, structureSoFar: string): void {
  console.warn(
      `Falling back to "${fallbackProperty}" with property \`${structureSoFar}\``,
  )
}

function getStructureDifferenceErrorMessage(
    fallbackObject: Strings,
    targetObject: Strings,
    key: string,
): string {
  return `Requested resource set and fallback set differ in structure! Fallback set's property \`${key}\` of type \`${
    // @ts-ignore: See comment on line 3
    typeof fallbackObject[key]
  }\` is of type \`${
    // @ts-ignore: See comment on line 3
    typeof targetObject[key]
  }\` in requested set.`
}

function updateStructureSoFar(structureSoFar: string, key: string): string {
  return `${structureSoFar}.${key}`
}

// This function intentionally mutates its second argument (targetObject)
function mergeOtherProperties(
    fallbackObject: Strings,
    targetObject: Strings,
    structureSoFar: string,
): void {
  for (const key in Object.keys(fallbackObject)) {
    // Looking for properties that aren't objects
    // @ts-ignore: See comment on line 3
    if (typeof fallbackObject[key] !== "object") {
      // @ts-ignore: See comment on line 3
      const fallbackProperty = fallbackObject[key]
      const newStructureSoFar = updateStructureSoFar(structureSoFar, key)
      // @ts-ignore: See comment on line 3
      const prop = targetObject[key]
      if (prop) {
        // Making sure that mutual properties are of the same type, else logs error telling about structural difference
        if (!(typeof fallbackProperty === typeof prop)) {
          console.warn(
              getStructureDifferenceErrorMessage(
                  fallbackObject,
                  targetObject,
                  key,
              ),
          )
          // If a structural difference is detected between the target object and the fallback object
          // then difference is eliminated by the fallback object overwriting the involved properties in the target object
          // as the assumption goes that the fallbackObject is the "right" one and the target object has to comply to its structure
          logFallback(fallbackProperty, newStructureSoFar)
          // @ts-ignore: See comment on line 3
          targetObject[key] = fallbackProperty
        }
      } else {
        // If the target object's property is missing, assigning the fallback object's corresponding property to the target object
        logFallback(fallbackProperty, newStructureSoFar)
        // @ts-ignore: See comment on line 3
        targetObject[key] = fallbackProperty
      }
    }
  }
}

// This function intentionally mutates its second argument (targetObject)
function checkForObjectProperties(
    fallbackObject: Strings,
    targetObject: Strings,
    structureSoFar: string,
): void {
  for (const key in Object.keys(fallbackObject)) {
    // Looking for properties that are objects
    // @ts-ignore: See comment on line 3
    if (typeof fallbackObject[key] === "object") {
      // @ts-ignore: See comment on line 3
      const newFBO = fallbackObject[key]
      const newStructureSoFar = updateStructureSoFar(structureSoFar, key)
      // @ts-ignore: See comment on line 3
      const newOBJ = targetObject[key]
      if (newOBJ) {
        // Making sure the target object's corresponding property also is an object, else logs error telling about structural difference
        if (typeof newOBJ === "object") {
          checkForObjectProperties(newFBO, newOBJ, newStructureSoFar)
          mergeOtherProperties(newFBO, newOBJ, newStructureSoFar)
        } else {
          const error = new Error(
              getStructureDifferenceErrorMessage(
                  fallbackObject,
                  targetObject,
                  key,
              ),
          )
          console.error(error.stack)
          // If a structural difference is detected between the target object and the fallback object
          // then difference is eliminated by the fallback object overwriting the involved properties in the target object
          // as the assumption goes that the fallbackObject is the "right" one and the target object has to comply to its structure
          logFallbackForObject(newStructureSoFar)
          // @ts-ignore: See comment on line 3
          targetObject[key] = newFBO
        }
      } else {
        // If the target object's property is missing, then assigning the fallback object's corresponding property to the target object
        logFallbackForObject(newStructureSoFar)
        // @ts-ignore: See comment on line 3
        targetObject[key] = newFBO
      }
    }
  }
}

function mergeResources(
    fallbackResources: Strings,
    resources: Strings,
    setName: string,
): Strings {
  // The second argument, "resources", gets mutated in the following two function calls
  checkForObjectProperties(fallbackResources, resources, setName)
  mergeOtherProperties(fallbackResources, resources, setName)
  return resources
}

export default mergeResources
