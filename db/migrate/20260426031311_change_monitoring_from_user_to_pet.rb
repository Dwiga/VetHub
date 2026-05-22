class ChangeMonitoringFromUserToPet < ActiveRecord::Migration[8.1]
  def change
    remove_reference :monitorings, :user, foreign_key: true, index: true
    add_reference :monitorings, :pet, null: false, foreign_key: true
  end
end
