class AddPicToMonitoring < ActiveRecord::Migration[8.1]
  def change
    add_reference :monitorings, :user, null: false, foreign_key: true
  end
end
