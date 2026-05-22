class MonitoringController < InertiaController
  before_action :authenticate_user!

  def create
    @pet = Pet.find(params[:pet_id])
    # The 'result' from the frontend corresponds to the 'data' column in the database
    @monitoring = @pet.monitorings.new(type: params[:type], data: params[:result])
    if params[:type] == 0
      @pet.update(weight: params[:result])
    elsif params[:type] == 1
      @pet.update(temperature: params[:result])
    end

    if @monitoring.save
      render json: {
        monitoring: Monitoring.where(pet_id: @pet.id, type: params[:type]).order(created_at: :desc).limit(10).reverse_order.map { |m| { date: m.created_at.strftime('%Y-%m-%d'), value: m.data } },
        error: nil,
        type: params[:type],
      }
    else
      render json: { monitoring: nil, error: @monitoring.errors.full_messages }
    end
  end

  private

  def monitoring_params
    # The 'result' from the frontend corresponds to the 'data' column in the database
    params.require(:monitoring).permit(:type, :data)
  end
end
