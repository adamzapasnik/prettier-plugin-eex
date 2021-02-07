const expressionTypeMatcher = require('../lib/expression_type_matcher');

describe('if', () => {
  test.each([
    ['<% if a do %>', 'start'],
    ['<%if a do%>', 'start'],
    ['<% if a do%>', 'start'],
    ['<%if a do %>', 'start'],

    ['<%= if a do %>', 'start'],
    ['<%=if a do%>', 'start'],
    ['<%= if a do%>', 'start'],
    ['<%=if a do %>', 'start'],

    ['<%# if a do %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('unless', () => {
  test.each([
    ['<% unless a do %>', 'start'],
    ['<%unless a do%>', 'start'],
    ['<% unless a do%>', 'start'],
    ['<%unless a do %>', 'start'],

    ['<%= unless a do %>', 'start'],
    ['<%=unless a do%>', 'start'],
    ['<%= unless a do%>', 'start'],
    ['<%=unless a do %>', 'start'],

    ['<%# unless a do %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('case', () => {
  test.each([
    ['<% case a do %>', 'start', 'nested'],
    ['<%case a do%>', 'start', 'nested'],
    ['<% case a do%>', 'start', 'nested'],
    ['<%case a do %>', 'start', 'nested'],

    ['<%= case a do %>', 'start', 'nested'],
    ['<%=case a do%>', 'start', 'nested'],
    ['<%= case a do%>', 'start', 'nested'],
    ['<%=case a do %>', 'start', 'nested'],

    ['<%# case a do %>', 'plain'],
  ])('matching %s returns %s type', (expression, type, subType = undefined) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type, subType });
  });
});

describe('cond', () => {
  test.each([
    ['<% cond a do %>', 'start', 'nested'],
    ['<%cond a do%>', 'start', 'nested'],
    ['<% cond a do%>', 'start', 'nested'],
    ['<%cond a do %>', 'start', 'nested'],

    ['<%= cond a do %>', 'start', 'nested'],
    ['<%=cond a do%>', 'start', 'nested'],
    ['<%= cond a do%>', 'start', 'nested'],
    ['<%=cond a do %>', 'start', 'nested'],

    ['<%# cond a do %>', 'plain'],
  ])('matching %s returns %s type', (expression, type, subType = undefined) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type, subType });
  });
});

describe('else', () => {
  test.each([
    ['<% else %>', 'middle'],
    ['<%else%>', 'middle'],
    ['<% else%>', 'middle'],
    ['<%else %>', 'middle'],

    ['<%# else %>', 'plain'],
    ['<%= else %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('end', () => {
  test.each([
    ['<% end %>', 'end'],
    ['<%end%>', 'end'],
    ['<% end%>', 'end'],
    ['<%end %>', 'end'],

    ['<%# end %>', 'plain'],
    ['<%= end %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('clause', () => {
  test.each([
    ['<% _ -> %>', 'middle_nested'],
    ['<%_ ->%>', 'middle_nested'],
    ['<% _ ->%>', 'middle_nested'],
    ['<%_ -> %>', 'middle_nested'],

    ['<%= _ -> %>', 'middle_nested'],
    ['<%=_ ->%>', 'middle_nested'],
    ['<%= _ ->%>', 'middle_nested'],
    ['<%=_ -> %>', 'middle_nested'],

    ['<%# _ -> %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('blocks', () => {
  test.each([
    ['<%= for post <- @posts do %>', 'start'],
    ['<%= for post <- @posts do%>', 'start'],
    ['<%=for post <- @posts do%>', 'start'],
    ['<%=for post <- @posts do %>', 'start'],

    ['<%#for post <- @posts do %>', 'plain'],

    ['<%= form_for @conn, fn f -> %>', 'start'],
    ['<%= form_for @conn, fn f ->%>', 'start'],
    ['<%=form_for @conn, fn f -> %>', 'start'],
    ['<%=form_for @conn, fn f ->%>', 'start'],

    ['<%# form_for @conn, fn f -> %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});

describe('plain', () => {
  test.each([
    ['<%= ss = ss%>', 'plain'],
    ['<% ss = ss%>', 'plain'],
    ['<%# ss = ss %>', 'plain'],
    ['<%# ss = ss(\na: ss) %>', 'plain'],
  ])('matching %s returns %s type', (expression, type) => {
    expect(expressionTypeMatcher(expression)).toEqual({ type });
  });
});
