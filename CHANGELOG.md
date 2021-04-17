# Changelog

All notable changes to the prettier-plugin-eex will be documented in this file.

## Unreleased

### Bug fixes

- Return non 0 exit status when error formatting is unsuccessful
- Use `print` function instead of `embed` to fix error logging

## v0.4.0 - 24 February 2021

### Bug Fixes

- Properly formats regular form_for expressions and the liveview ones (with </form> tags)

## v0.3.0 - 11 February 2021

### Bug Fixes

- Properly formats liveview files with form_for expressions

## v0.2.0 - 7 February 2021

### Changes

- decoding/encoding logic has been extracted to prettier-html-templates package

### Bug Fixes

- In some cases expressions weren't decoded inside script tags

## v0.1.0 - 25 January 2021

Initial release
