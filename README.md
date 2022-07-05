# Prettier EEX Plugin

## How to install?

```sh
  yarn add -D prettier prettier-plugin-eex
```

## Supported versions

- Elixir 1.10 minimum
- Erlang OTP 22 minimum

## Config options

* printWidth - used by Prettier directly
* eexMultilineNoParens - Array - used to format multiline expressions, provide which functions shouldn't wrap parens around arguments
* eexMultilineLineLength - Number - used to format multiline expressions

Example:

```js
  {
    "printWidth": 130,
    "eexMultilineLineLength": 100,
    "eexMultilineNoParens": [
      "link",
      "form_for"
    ]
  }
```

## How to install in Phoenix project?

Add .prettierignore file with:

```plain
deps/
_build/
.elixir_ls
assets
priv
```

And .prettierrc.js

```js
module.exports = {
  printWidth: 120,
};
```

```sh
cd assets
yarn add -D prettier prettier-plugin-eex
```

### How to use?

Add to `mix.exs` `aliases` and use as `mix prettier`

```elixir
defp aliases do
  [...
    prettier: "cmd ./assets/node_modules/.bin/prettier --check . --color"
  ]
end
```

### How to make it work with Prettier Visual Studio code extension?

It's important to add node modules path.

```json
"prettier.prettierPath": "./assets/node_modules/prettier"
```

## How to deal with bugs?

Your code wasn't formatted correctly or there was an error? Add the problematic file to .prettierignore and submit an Issue.
