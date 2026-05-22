class OwnerController < InertiaController
  before_action :authenticate_user!
  before_action :sync_app_mode

  def index
    @pagy, @records = pagy(
      Pet.all.includes(:user, :species)
      .where(users: { id: current_user.id })
      .order(:name),
    )
    render inertia: {
      pets: InertiaRails.scroll(@pagy) { @records.as_json() },
      user: current_user,
      species: Species.all.map(&:as_json),
      genders: Pet.genders.map do |k, v|
        { id: v, name: k.humanize }
      end
    }
  end

  private

  def sync_app_mode
    set_app_mode("pet")
  end
end
