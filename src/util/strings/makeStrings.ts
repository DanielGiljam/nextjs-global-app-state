import {Strings} from "./index"

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
  return `Requested resource set and fallback set differ in structure! Fallback set's property \`${key}\` of type \`${typeof fallbackObject[
      key
  ]}\` is of type \`${typeof targetObject[key]}\` in requested set.`
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
  for (const key of Object.keys(fallbackObject)) {
    // Looking for properties that aren't objects
    if (typeof fallbackObject[key] !== "object") {
      const fallbackProperty = fallbackObject[key]
      const newStructureSoFar = updateStructureSoFar(structureSoFar, key)
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
          targetObject[key] = fallbackProperty
        }
      } else {
        // If the target object's property is missing, assigning the fallback object's corresponding property to the target object
        logFallback(fallbackProperty, newStructureSoFar)
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
  for (const key of Object.keys(fallbackObject)) {
    // Looking for properties that are objects
    if (typeof fallbackObject[key] === "object") {
      const newFBO = fallbackObject[key]
      const newStructureSoFar = updateStructureSoFar(structureSoFar, key)
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
          targetObject[key] = newFBO
        }
      } else {
        // If the target object's property is missing, then assigning the fallback object's corresponding property to the target object
        logFallbackForObject(newStructureSoFar)
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

async function makeStrings(
    lang: string,
    stringsFetcher: (lang: string) => Promise<Strings>,
): Promise<Strings> {
  console.log("makeStrings: fetching strings for \"en\"...")
  const en = await stringsFetcher("en")
  if (lang === "en") return en
  console.log(`makeStrings: fetching strings for "${lang}"...`)
  const stringResources = await stringsFetcher(lang)
  return mergeResources(en, stringResources, "stringResources")
}

export default makeStrings
