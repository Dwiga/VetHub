class ApplicationController < ActionController::Base
  include Pagy::Method
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  inertia_share do
    {
      auth: {
        user: current_user
      },
      app_mode: cookies[:app_mode] || "pet",
      flash: flash.to_h
    }
  end

  def after_sign_in_path_for(resource)
    case cookies[:app_mode]
    when "vet"
      vet_index_path
    else
      owner_index_path
    end
  end

  protected

  def set_app_mode(mode)
    cookies[:app_mode] = {
      value: mode,
      expires: 1.year.from_now,
      path: "/"
    }
  end

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
end
