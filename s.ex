defmodule Blocks.LiveDashboard.DashboardCardComponent do
  use Phoenix.LiveComponent
  use Phoenix.HTML

  import Phoenix.LiveView.Helpers
  import Blocks.LiveDashboard.ErrorHelpers

  def render(assigns) do
    ~L"""
    <div id="<%= @id %>">
      <h5 class="card-title">Components</h5>
      <div class="card">
        <div class="row px-2">
          <%= render_navbar(assigns) %>

          <%= if @module do %>
            <%= render_main_panel(assigns) %>
          <% else %>
            <%= render_empty_state(assigns) %>
          <% end %>
        </div>
      </div>
    </div>

    <%= render_changeset_feedback_css_override(assigns) %>
    """
  end

  defp render_main_panel(assigns) do
    ~L"""
    <div class="col-10 ms-sm-auto px-4">
      <h6 class="h6 border-bottom pt-4">
        <%= if @module, do: "#{@module.name()} · #{@module} · '#{@example}' example" %>
      </h6>
      <div
        id="dashboard-component-top-pane"
        class="block bg-light p-4 mb-4"
        style="height: calc(<%= @iframe_height %>px + 100px);"
      >
        <%= render_iframe(assigns) %>
      </div>

      <div id="dashboard-component-bottom-pane">
        <%= render_tabs(assigns) %>

        <div class="block border border-top-0 px-2 py-4 mb-4">
          <%= render_tab_contents(assigns) %>
        </div>
      </div>
    </div>
    """
  end

  defp render_menu_items(type, assigns) when type in [:stateless, :stateful] do
    ~L"""
    <%= if Enum.any?(@components, &(&1.type() == type)) do %>
      <li>
        <h6 class="sidebar-heading px-3 mb-1 h6 text-muted">
          <%= format_atom(type) %>
        </h6>
      </li>
      <%= for component <- @components, component.type() == type do %>
        <li class="nav-item">
          <a
            class="nav-link <%= if @module == component, do: "active text-dark" %>"
            href="#"
            phx-click="show_component"
            phx-value-module="<%= component %>"
            phx-value-tab="<%= @tab %>"
            phx-value-example="default"
          >
            <%= component.name() %>
          </a>
        </li>
      <% end %>
    <% end %>
    """
  end

  defp render_tab_contents(%{tab: :examples} = assigns) do
    ~L"""
    <ul>
      <%= for {example, attrs} <- @module.examples() do %>
        <li>
          <a
            class="<%= if @example == example, do: "text-dark" %>"
            phx-click="show_example"
            phx-value-example="<%= example %>"
            phx-value-module="<%= @module %>"
            phx-value-tab="<%= @tab %>"
            href="#"
          >
            <%= format_atom(example) %>
            <%= if attrs[:description], do: "- #{attrs[:description]}" %>
          </a>
        </li>
      <% end %>
    </ul>
    """
  end

  defp render_tab_contents(%{tab: :assigns, module: module} = assigns) do
    ~L"""
    <div class="px-4">
      <%= f = form_for @changeset, "#", [phx_change: "change_assigns", as: :assigns_params] %>
        <%= for {field_key, _field_type} <- module.schema_info() do %>
          <div class="form-group">
            <%= label f, field_key %>
            <%= text_input f, field_key, class: "form-control" %>
            <%= error_tag f, field_key %>
          </div>
        <% end %>
      </form>
    </div>
    """
  end

  defp render_tab_contents(%{tab: :events} = assigns) do
    ~L"""
    <span class="badge badge-primary">Coming soon</span>
    """
  end

  defp render_tab_contents(%{tab: :messages} = assigns) do
    ~L"""
    <span class="badge badge-primary">Coming soon</span>
    """
  end

  defp render_tab_contents(_), do: nil

  defp render_tabs(assigns) do
    ~L"""
    <ul class="nav nav-tabs">
      <%= for {this_tab, tab_for_component_type} <- @tabs do %>
        <%= render_tab(this_tab, tab_for_component_type, assigns) %>
      <% end %>
    </ul>
    """
  end

  defp render_tab(tab, tab_for_component_type, assigns) do
    active = if assigns.tab == tab, do: "active"
    disabled = if tab_for_component_type not in [:any, assigns.module.type()], do: "disabled"

    ~L"""
    <li class="nav-item">
      <a class="nav-link <%= "#{active} #{disabled}" %>" href="#" phx-click="show_tab" phx-value-tab="<%= tab %>">
        <%= format_atom(tab) %>
      </a>
    </li>
    """
  end

  defp render_empty_state(assigns) do
    ~L"""
    <div class="col-10 ms-sm-auto px-4 py-4">
      <p>No component selected</p>
    </div>
    """
  end

  defp render_iframe(assigns) do
    ~L"""
    <%= if @host_pid do %>
      <iframe
        style="border: 0; width: 100%; height: calc(<%= @iframe_height %>px + 60px);"
        src="components/preview?host_pid=<%= @host_pid %>"
      ></iframe>
    <% end %>
    """
  end

  defp render_navbar(assigns) do
    ~L"""
    <nav class="col-2 border-right">
      <div class="pt-4 pb-4">
        <ul class="nav flex-column">
          <%= render_menu_items(:stateless, assigns) %>
          <%= render_menu_items(:stateful, assigns) %>
        </ul>
      </div>
    </nav>
    """
  end

  # FIXME: Work out a better way to show the feedback
  # phoenix_live_view sets .invalid-feedback to 'display: none' in its priv/static/app.css
  defp render_changeset_feedback_css_override(assigns) do
    ~L"""
    <script>
      var style = document.createElement('style');
      var css =
        '.invalid-feedback { display: block; } ' +
        '.phx-no-feedback.invalid-feedback, ' +
        '.phx-no-feedback .invalid-feedback { display: none }';
      style.innerHTML = css;
      document.body.appendChild(style);
    </script>
    """
  end

  defp format_atom(atom) when is_atom(atom) do
    atom
    |> to_string()
    |> String.capitalize()
    |> String.replace("_", " ")
  end
end
