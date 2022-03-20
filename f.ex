defmodule Backoffice.FilterComponent do
  @impl true
  def render(assigns) do
    ~L"""
    <%= f = form_for :filters, "#", [id: "filter_form", phx_change: :change, phx_target: @myself, phx_submit: :ignore] %>
                                                                                              <div>
                                                                                                <%= if Enum.empty?(@active_filters) do %>
                                                                                                  <p>No active filters</p>
                                                                                                <% else %>
                                                                                                  <%= for {field, val} <- Enum.reverse(@active_filters) do %>
                                                                                                    <div id="<%= "#{field}-#{System.unique_integer()}" %>">
                                                                                                      <span
                                                                                                        phx-target="<%= @myself %>"
                                                                                                        phx-click="remove"
                                                                                                        phx-value-field="<%= field %>"
                                                                                                      >

                                                                                                      </span>
                                                                                                    </div>
                                                                                                  <% end %>
                                                                                                <% end %>
                                                                                              </div>
                                                                                            </form>
    """
  end

end
