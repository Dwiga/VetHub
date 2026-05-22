# frozen_string_literal: true

class HomeController < InertiaController
  def index
    if user_signed_in?
      case cookies[:app_mode]
      when "vet"
        redirect_to vet_index_path
      else
        redirect_to owner_index_path
      end
      return
    end

    render inertia: {
      rails_version: Rails.version,
      ruby_version: RUBY_DESCRIPTION,
      rack_version: Rack.release,
      inertia_rails_version: InertiaRails::VERSION
    }
  end
end
