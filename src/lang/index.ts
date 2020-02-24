import {StringsContext, Strings} from "../contexts/strings"

import makeStrings from "../contexts/strings/makeStrings"

import {
  getLangServerSide,
  getLangClientSide,
  setLangClientSide,
} from "../util/strings"

import {GlobalAppStatePropertyParameters} from "../GlobalAppStateProperty"

interface LangOptions {
  defaultValue: string;
  defaultValues: string[];
  getValues?: {
    serverSide?(): Promise<Set<string>>;
    clientSide?(): Promise<Set<string>>;
  };
}

function lang({
  defaultValue,
  defaultValues,
  getValues,
}: LangOptions): GlobalAppStatePropertyParameters<string, Strings> {
  return {
    key: "lang",
    defaultValue,
    defaultValues: new Set<string>(defaultValues),
    initializeValue: {
      serverSide: getLangServerSide,
      clientSide: getLangClientSide,
    },
    getValues,
    setValue: setLangClientSide,
    controlContext: {
      transformValue: makeStrings,
      isSerializable: true,
      context: StringsContext,
    },
  }
}

export default lang
