defmodule TestsElixir.MixProject do
  use Mix.Project

  def project do
    [
      app: :tests_elixir,
      version: "0.1.0",
      elixir: "~> 1.8",
      aliases: aliases()
    ]
  end

  def aliases do
    [
      prettier: "cmd ../node_modules/.bin/prettier --plugin ../ --check ./formatted_views --color"
    ]
  end
end
