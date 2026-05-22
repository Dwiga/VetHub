class VetController < InertiaController
  before_action :authenticate_user!
  before_action :require_vet_role, only: [ :lookup, :employees ]
  before_action :sync_app_mode, only: [ :index, :lookup ]

  def index
    render inertia: {
      vet: current_user.vet
    }
  end

  def new
    render inertia: {}
  end

  def create
    @vet = Vet.new(vet_params)
    @user = current_user
    @user.vet = @vet
    @user.vet_role = :administrator

    if @vet.save && @user.save
      set_app_mode("vet")
      redirect_to vet_index_path, notice: "Vet successfully created"
    else
      redirect_back fallback_location: new_vet_path, alert: @vet.errors.full_messages.join(", ")
    end
  end

  def lookup
    raw_phone = params[:phone]
    phone = PhoneNumber.normalize(raw_phone)

    if phone.blank?
      render inertia: "vet/lookup", props: {}
      return
    end

    owner = User.find_by(phone_number: phone)
    pets = Pet.where(owner_phone: phone).includes(:species).order(:name)

    render inertia: "vet/patient", props: {
      phone: phone,
      raw_phone: raw_phone,
      owner: owner&.as_json(only: [ :id, :name, :email, :phone_number, :address ]),
      pets: pets.as_json,
      species: Species.all.map(&:as_json),
      genders: Pet.genders.map { |k, v| { id: v, name: k.humanize } }
    }
  end

  def employees
    render inertia: {
    }
  end

  private

  def sync_app_mode
    set_app_mode("vet")
  end

  def require_vet_role
    unless current_user.vet.present? && current_user.vet_role.present?
      redirect_to vet_index_path, alert: "Vet role required"
    end
  end

  def vet_params
    params.require(:vet).permit(:name, :phone, :address, :email)
  end
end
